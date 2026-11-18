#!/usr/bin/env node
// Privacy check: fails if tracked files (or git history) contain anything that
// identifies the local machine or person, or looks like a secret.
//
// Usage:
//   node scripts/check-privacy.mjs              # tracked files + full git history
//   node scripts/check-privacy.mjs --no-history # tracked files only (pre-commit)
//
// Machine-specific values (OS username, hostname) are read at runtime, so this
// script itself contains no personal data.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import os from 'node:os';

const skipHistory = process.argv.includes('--no-history');
const MAX_FILE_BYTES = 1_000_000;
const SELF = 'scripts/check-privacy.mjs';
// Lockfiles legitimately contain many strings; only run secret/path checks there.
const EMAIL_SKIP = new Set(['package-lock.json']);

const git = (args, opts = {}) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- Build the rule list ----------------------------------------------------
const rules = [
  { name: 'macOS home path', re: /\/Users\/[A-Za-z0-9._-]+/g },
  { name: 'Linux home path', re: /\/home\/[A-Za-z0-9._-]+/g },
  { name: 'Windows user path', re: /[A-Za-z]:\\Users\\[A-Za-z0-9._ -]+/g },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { name: 'API secret key', re: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'Private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  {
    name: 'Email address (only noreply/example allowed)',
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    allow: (m) => /@users\.noreply\.github\.com$/i.test(m) || /@example\.(com|org)$/i.test(m),
    skipFile: (f) => EMAIL_SKIP.has(f),
  },
];

const username = (() => {
  try { return os.userInfo().username; } catch { return ''; }
})();
const host = os.hostname();
const hostShort = host.split('.')[0];
// The username and hostname rules protect the *author's* machine. In CI they would
// describe the runner (whose username is a common word), producing false positives,
// so they run on developer machines only. Path, email and secret rules always run.
const inCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
for (const [label, value, minLen] of [
  ['local username', username, 3],
  ['hostname', host, 5],
  ['short hostname', hostShort, 5],
]) {
  if (!inCI && value && value.length >= minLen) {
    rules.push({
      name: `Machine identifier (${label})`,
      re: new RegExp(`(?<![A-Za-z0-9])${escapeRe(value)}(?![A-Za-z0-9])`, 'gi'),
    });
  }
}

// --- Scan helpers -----------------------------------------------------------
const problems = [];

function scanText(text, where, file) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (rule.skipFile?.(file)) continue;
      rule.re.lastIndex = 0;
      for (const m of line.matchAll(rule.re)) {
        if (rule.allow?.(m[0])) continue;
        // Never echo the matched value in full: avoid re-leaking it into CI logs.
        const shown = m[0].length > 6 ? `${m[0].slice(0, 3)}…(${m[0].length} chars)` : '…';
        problems.push(`${where}:${i + 1}  ${rule.name}  [${shown}]`);
      }
    }
  });
}

function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0);
}

// --- 1. Tracked files (including staged) ------------------------------------
const files = git(['ls-files', '--cached', '--others', '--exclude-standard'])
  .split('\n')
  .filter(Boolean)
  .filter((f) => f !== SELF);

for (const f of files) {
  let st;
  try { st = statSync(f); } catch { continue; }
  if (!st.isFile() || st.size > MAX_FILE_BYTES) continue;
  const buf = readFileSync(f);
  if (isBinary(buf)) continue;
  scanText(buf.toString('utf8'), f, f);
}

// --- 2. Git history ---------------------------------------------------------
if (!skipHistory) {
  let hasCommits = true;
  try { git(['rev-parse', '--verify', 'HEAD'], { stdio: 'pipe' }); } catch { hasCommits = false; }

  if (hasCommits) {
    // Author/committer identities
    const idents = git(['log', '--all', '--format=%an <%ae>%n%cn <%ce>']).split('\n').filter(Boolean);
    for (const id of new Set(idents)) {
      const email = /<(.*)>/.exec(id)?.[1] ?? '';
      if (!/@users\.noreply\.github\.com$/i.test(email)) {
        problems.push(`git history  commit identity is not a noreply address  [${email.slice(0, 3)}…]`);
      }
    }
    // Commit messages and patches (excluding this script's own patches)
    const patch = git(['log', '--all', '-p', '--format=commit %H%n%B', '--', '.', `:(exclude)${SELF}`]);
    scanText(patch, 'git history', '');
  }
}

// --- Report -----------------------------------------------------------------
if (problems.length) {
  console.error(`\nPrivacy check FAILED (${problems.length} finding(s)):\n`);
  for (const p of problems.slice(0, 50)) console.error(`  - ${p}`);
  if (problems.length > 50) console.error(`  …and ${problems.length - 50} more`);
  console.error('\nRemove the data (and rewrite local history if it is already committed) before pushing.');
  process.exit(1);
}
console.log(`Privacy check passed (${files.length} files${skipHistory ? '' : ' + history'}).`);
