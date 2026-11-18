# Project Plan: Tile Rivals

An online, real-time 2048-style game. Play against the computer, or send a room code to a friend and race on identical boards.

Status: **in progress.** M0 to M2 are complete (see the README for current features); this document is the original plan, kept as written so the build can be compared against it.

**Decisions locked in:** Retro pixel theme · React + Vite client · Node + Socket.IO server · selectable match format (timed race or first-to-2048).
Timeline: **14 days** (scoped down from the first 28-day draft; cut items are in the "Could have" list and the README roadmap).

---

## 1. Goals

1. A game that is genuinely fun to play, not only a tech demo.
2. Proof of engineering depth for a software/AI engineering resume: deterministic engine, real-time netcode, an AI opponent, tests, CI, deployment.
3. A GitHub history that shows steady, real work (small daily commits, tagged releases).
4. A README that tells the story: how it was built, what features exist, and which industry design standards were followed.

## 2. Game design

**Core rules:** classic 2048 (4x4 grid, slide and merge, 2s and 4s spawn after each move).

**Versus mode (the twist):**
- Both players get the **same seeded spawn sequence**, so the match is decided by skill, not luck.
- Each plays their own board at the same time and sees the opponent's board live.
- **Two selectable formats** (host picks for friend matches; picker shown for vs Computer):
  - **Timed Race:** ends at 2:00 or when both boards are locked. Highest score wins. Reaching 2048 first is an instant win.
  - **First to 2048:** first player to build the 2048 tile wins. A 10-minute hard cap (highest score wins) prevents endless stalls.
- Rematch button, with a best-of-three option later.

**Visual and audio style: retro pixel.**
- Pixel font (e.g. Press Start 2P), chunky bordered tiles, limited palette per tile tier, CRT-style scanline overlay that can be turned off.
- Pixel art done in CSS and inline SVG, so there are no external asset dependencies or licensing issues.
- Chiptune sound effects synthesized with the Web Audio API (square/triangle waves), so no audio files are needed. Merge sounds rise in pitch with tile value.

**Modes:**
| Mode | Description |
|---|---|
| Solo | Classic 2048 with local best score. Doubles as practice and tutorial. |
| vs Computer | AI opponent with Easy / Medium / Hard. |
| vs Friend | Create a room, share a 4-letter code or link, play online. |

**Power-ups:** deferred to post-v1.0 (one-use Undo and Shuffle per match) to protect the two-week timeline.

## 3. Features

**Must have (v1.0)**
- Deterministic game engine shared by client and server
- Computer opponent (expectimax search) with three difficulty levels
- Online rooms with room codes and join links
- Server-authoritative moves (the server validates every move)
- Live opponent board, countdown, timer, win/lose/draw screens, rematch
- Reconnect handling and clean disconnect/forfeit behavior
- Keyboard (arrows/WASD), touch swipe, and on-screen controls
- Sound effects with mute, settings that persist locally
- Responsive layout (phone to desktop)

**Should have (only if ahead of schedule)**
- Short first-run tutorial overlay (3 steps, not a full interactive course)
- Local stats: games played, win rate, best score
- Colorblind-safe tile palette, reduced-motion mode (cheap, so these two are effectively Must)

**Could have (post-v1.0, listed in README roadmap)**
- Gamepad support
- Power-ups (Undo, Shuffle)
- Public matchmaking queue, ELO-style rating
- Spectator link, replay of a match from its seed plus move list
- Daily challenge seed shared by everyone

## 4. Game industry design standards we will follow

This is the checklist the README will report against. Each item is implemented and listed with how it was verified.

| Standard | What it means here |
|---|---|
| **Game feel / juice** | Tile slide easing, merge pop, spawn scale-in, score count-up, screen shake on big merges (off in reduced-motion), satisfying audio per merge tier |
| **Input responsiveness** | Input handled on keydown, input buffering for rapid presses, no blocking animations, target under 100 ms input-to-feedback |
| **Clarity and feedback** | Every action has visual and audio confirmation; clear turn/match state at all times; readable HUD hierarchy |
| **Onboarding (FTUE)** | First run shows a short interactive tutorial, not a wall of text; difficulty and rules explained in context |
| **Fairness** | Seeded shared spawns; server-authoritative state; rate limiting; no client trust |
| **Netcode basics** | Server authority, client prediction for own board, reconciliation on mismatch, reconnect grace period, graceful disconnect |
| **Accessibility** | Colorblind-safe palette plus number labels, reduced-motion option, full keyboard operation, ARIA live regions for score and results, minimum contrast ratios, touch targets of 44 px or larger |
| **Difficulty curve** | AI difficulty tiers tuned and benchmarked (see AI section); no unfair rubber-banding |
| **Player-safety defaults** | No free-text chat; only preset emotes (stretch); no accounts or personal data required |
| **Performance** | 60 fps target, small bundle, no frame drops on mid-range phones, measured with browser profiling |
| **Persistence and settings** | Settings, stats and tutorial-seen flag stored locally, with safe fallback if storage is blocked |
| **Playtesting** | Structured playtests with friends, results logged in the dev log, changes traced to feedback |
| **Docs** | Short game design doc, architecture decision records, changelog, tagged releases |
| **Repo hygiene / privacy** | No machine paths, usernames, personal email or secrets in code, docs, images or git history; automated check in CI (see section 10a) |

## 5. Architecture

```
/shared       engine.ts, ai.ts (pure logic, no DOM, no Node APIs) - imported by client AND server
/server       Node + Socket.IO: rooms, match lifecycle, validation, rate limiting
/client       React + Vite app: screens, board, HUD, audio, settings
/tests        engine, AI, protocol, and room-lifecycle tests (Vitest)
/docs         game-design.md, decisions/ (ADRs), devlog/, playtests.md, protocol.md
```

**Stack**
| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One typed engine and one typed protocol shared by client and server |
| Client | React + Vite | Component structure, fast dev loop, recognizable to employers |
| Server | Node + Socket.IO | Same language as the client so the engine is shared; rooms and automatic reconnection are built in, which saves time on M5 |
| Tests | Vitest | Works for shared, client and server code with one runner |
| CI | GitHub Actions | Lint, typecheck, test, build on every push |
| Hosting | One free-tier Node host (Render or Fly.io) serving the built client and the Socket.IO server together | One deploy, no CORS problems |

**Why this shape:**
- The engine is a pure function over state, so the same code runs in the browser (prediction), on the server (authority) and in tests (determinism).
- Spawns come from `hash(seed, spawnIndex)`, so identical seeds yield identical random numbers for both players, and a whole match can be replayed from `seed + moves`.
- Socket.IO trade-off, recorded as an ADR: it adds a dependency and abstracts the raw protocol, but gives reconnection and rooms for free. We accept that for the 14-day timeline.

**Protocol (Socket.IO events):** `room:create`, `room:join`, `match:start`, `move`, `state`, `opp:state`, `match:end`, `rematch`, `opp:left`. Documented in `docs/protocol.md`.

## 6. Computer opponent

- Expectimax search over the shared engine, with a heuristic combining empty cells, monotonicity, smoothness and max-tile-in-corner.
- **Easy:** greedy moves plus deliberate mistakes. **Medium:** depth 2. **Hard:** depth 3 with chance-node sampling (capped so it stays fast without a Web Worker; add one only if profiling shows jank).
- Move pace varies by tier so it feels human and beatable.
- **Benchmark harness** runs 50 games per tier and records reach-tile rates. Results go in the README as a table (the "evals" hiring managers like).

## 7. Testing and quality

- Unit tests: slide/merge rules, spawn determinism, game over detection, score.
- Property tests: tile total never decreases incorrectly, same seed + same moves gives the same board.
- AI tests: legal moves only, tier ordering (Hard beats Medium beats Easy over N games).
- Server tests: room lifecycle, invalid moves rejected, disconnect and reconnect, rate limits.
- CI runs everything on each push. Manual playtest checklist before each release.

## 8. Milestones (each tagged and logged)

| Milestone | Scope | Target |
|---|---|---|
| **M0** | Own project folder and repo, noreply commit identity, strict `.gitignore`, privacy-check script + CI, Vite + TypeScript scaffold, README skeleton, dev log | Day 1 |
| **M1** | Engine + tests, playable solo in browser | Days 1-3 |
| **M2** | Game feel pass: animations, sound, input buffering, touch | Days 4-5 |
| **M3** | AI opponent, vs Computer mode, benchmark table | Days 6-7 |
| **M4** | Server, rooms, online versus, server-side validation | Days 8-10 |
| **M5** | Reconnect, rate limits, netcode tests | Day 11 |
| **M6** | Accessibility (palette, reduced motion), tutorial overlay, mobile polish | Day 12 |
| **M7** | Two playtests, bug fixes, deploy, README final pass, v1.0 tag | Days 13-14 |

**Cadence:** the work above is sized for focused sessions of a few hours a day, with small commits throughout and one tagged release per milestone.

**Scope guardrails for 14 days:**
- Pixel art and chiptune audio are generated in code (CSS, SVG, Web Audio), so no asset hunting or licensing.
- Both match formats ship, but they share one match loop; the format is a config value (timer vs target tile), not a second code path.
- No accounts, no chat, no matchmaking queue.
- If a milestone slips by more than half a day, cut from "Should have" first; never cut tests, the README, or the design-standards report.
- Day 7 is a checkpoint: solo plus vs Computer must be fully playable. If not, online play shrinks to the bare minimum (create, join, play, result).

## 9. How the README will document development

The README is part of the deliverable, kept up to date as work happens:

1. **Hero:** GIF of a versus match, live demo link, one-line pitch.
2. **Features:** the list above, with checkmarks as they ship.
3. **How it was built:** a short narrative per milestone (what, why, what went wrong), linked to the dev log.
4. **Design standards report:** the table in section 4, each row marked done with how it was verified.
5. **Architecture:** diagram, protocol summary, key decisions (linked ADRs).
6. **AI opponent:** approach and the benchmark results table.
7. **Testing and CI:** badge, what is covered.
8. **Run it yourself:** under 5 minutes, including playing with a friend on the same network.
9. **Playtest findings and roadmap.**

A running `docs/devlog/` gets one short entry per work session, so the real history is recorded as it happens and not reconstructed later. Decisions with trade-offs get a one-page ADR in `docs/decisions/`.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Latency makes versus feel bad | Each player's own board is predicted locally; server only validates |
| Cheating | Server-authoritative moves, rate limits, seed kept server-side until start |
| AI too slow in the browser | Run search in a Web Worker, cap depth, benchmark early |
| React re-render cost hurts animation smoothness | Memoized tile components, CSS transforms for movement, profile at M2 |
| Pixel look hurts readability or accessibility | Number labels on every tile, contrast checks, CRT overlay optional and off for reduced-motion |
| Scope creep / 14-day limit | Must/Should/Could tiers; v1.0 ships Must only; Day 7 checkpoint; cut Should-haves first |
| Free hosting sleeps | Show a "waking server" state; document it |

## 10a. Privacy and repo hygiene (nothing about the author's machine goes public)

The repo is public, so it must contain nothing that identifies the machine, the local setup or the person beyond the GitHub profile they chose to show.

**Rules**
1. **Own folder, clean root.** The game gets its own project directory and its own git repo. The repo root is never a home directory or a parent folder, so no unrelated files get swept in.
2. **Relative paths only.** No absolute paths anywhere: code, configs, docs, devlog, README, test fixtures, build scripts. Everything is relative to the project root or uses `import.meta`/`path` helpers.
3. **Commit identity:** use the GitHub `noreply` address for commits (set per-repo, not globally), so no personal email lands in history. Turn on "Keep my email addresses private" and "Block command line pushes that expose my email" in GitHub settings.
4. **Strict `.gitignore` from the first commit:** `.env*`, `node_modules/`, `dist/`, `coverage/`, `*.log`, `.DS_Store`, editor folders (`.vscode/`, `.idea/`), AI-tool and local config (`.claude/`, local settings files), OS and temp files. Provide `.env.example` with placeholder values only.
5. **No machine details in docs.** The devlog and README describe what was done, not where. No usernames, hostnames, home-directory paths, local IPs, or screenshots showing desktop, file explorers or terminals with identifying text. Demo GIFs are cropped to the game window only.
6. **Build output check.** Source maps, error stack traces and build logs can embed absolute paths. The production build is configured to avoid this, and `dist/` is checked before any deploy.
7. **No secrets.** No API keys, tokens or deploy credentials in code or history. Deploy secrets live only in the host's environment settings.
8. **Dependencies:** lockfile committed; check it for private registry URLs or local `file:` links before publishing.

**Enforcement (automated, not just good intentions)**
- A `scripts/check-privacy` script (run in CI and as a pre-commit hook) scans tracked files and the git history for: absolute home-directory paths, the local username, hostnames, email addresses other than the noreply address, and common secret patterns. It fails the build on any match.
- Secret scanning (gitleaks or GitHub's built-in scanning) enabled on the repo.
- **Before the first push:** review the full history and file list by hand, and fix anything found by rewriting local history *before* it is ever published (much easier than cleaning a public repo later, where forks and caches can keep old data).
- Checklist item on every release: run the privacy check, review `git ls-files`, and look through the final README and images.

The README will list these safeguards in the design-standards section as a "Repo hygiene" item.

---

## 11. Decisions made

- **Name:** Tile Rivals.
- **Look:** retro pixel.
- **Stack:** React + Vite client, Node + Socket.IO server, TypeScript throughout.
- **Match format:** both Timed Race and First to 2048, selectable.
- **Hosting:** a free-tier Node host is planned for the online milestone; nothing is deployed yet.
