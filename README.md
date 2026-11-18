# Versus 2048

A real-time, online 2048 with a retro pixel look. Race a friend or the computer on **identical boards**: both players get the same seeded tile spawns, so the winner is the better player, not the luckier one.

> **Status:** early development (M2 done: solo mode is playable with animation and sound). vs Computer and online play come next. Demo GIF and live link will appear here at v1.0.

## Features

Checked items are shipped; the rest follow the milestone plan in [docs/plan.md](docs/plan.md).

- [x] Deterministic 2048 engine shared by client and server (M1): pure functions, seeded spawns, replayable from `seed + moves`, 41 tests
- [x] Solo mode (M1): keyboard (arrows/WASD) and swipe, best score saved locally, game over and "keep going" after 2048
- [x] Game feel (M2): tile slide, spawn and merge animations, score pop, screen shake on big merges, synthesized chiptune sound (merge pitch rises with tile value), sound and reduced-motion settings that persist
- [ ] vs Computer with Easy / Medium / Hard (M3)
- [ ] vs Friend online with room codes (M4)
- [ ] Two match formats: Timed Race and First to 2048 (M4)
- [ ] Reconnect handling and rate limiting (M5)
- [ ] Accessibility, tutorial, mobile polish (M6)

## How it was built

The build is documented as it happens, not reconstructed afterwards.

- **Plan:** [docs/plan.md](docs/plan.md): goals, design, architecture, 14-day schedule, risks.
- **Dev log:** [docs/devlog/](docs/devlog/): one short entry per work session.
- **Decisions:** [docs/decisions/](docs/decisions/): one-page records of choices with trade-offs.
- **Changelog:** [CHANGELOG.md](CHANGELOG.md).

## Game industry design standards

Each row is marked done only when implemented and verified. See the full definitions in [docs/plan.md](docs/plan.md#4-game-industry-design-standards-we-will-follow).

| Standard | Status | How it is verified |
|---|---|---|
| Game feel / juice | Done (M2) | Slide, spawn-pop, merge-pop, score pop, shake and pitch-scaled sound. Animation layout checked in-browser: 0 misaligned tiles over a full game |
| Input responsiveness | Done (M2) | Moves fire on keydown and apply instantly; animations are cosmetic and never block input, so there is nothing to queue. Rapid-fire test (273 keys, no pauses) ended with no lock-ups or overlapping tiles |
| Clarity and feedback | Done (M2) | Every action gives visual and audio feedback; no-op moves give none and are not counted. Tile-tracking is fuzz-tested against the engine over 25 games |
| Onboarding (first-time experience) | Planned (M6) | |
| Fairness (seeded spawns, server authority) | Seeded spawns done (M1); server authority planned (M4) | Test: two players on one seed get the same spawn value for the same spawn number |
| Netcode basics | Planned (M4, M5) | |
| Accessibility | Planned (M6) | |
| Difficulty curve | Planned (M3) | |
| Player-safety defaults | Planned | |
| Performance | Planned (M2, M7) | |
| Persistence and settings | Planned (M6) | |
| Playtesting | Planned (M7) | |
| Docs | In progress | Plan, dev log, ADRs present |
| **Repo hygiene / privacy** | **Done (M0)** | `npm run privacy` runs in CI and as a pre-commit hook |

## Tech stack

TypeScript everywhere · React + Vite (client) · Node + Socket.IO (server) · Vitest · GitHub Actions.
Pixel art is drawn in CSS/SVG and sound is synthesized with the Web Audio API, so there are no asset files.

## Run it yourself

Requires Node 20 or newer.

```bash
npm install
npm run setup        # enables the pre-commit privacy hook
npm run dev:server   # terminal 1: Socket.IO server on port 3001
npm run dev:client   # terminal 2: client on http://localhost:5173
```

Other scripts: `npm test`, `npm run typecheck`, `npm run privacy`, `npm run check` (all three), `npm run build`.

## Repo hygiene

This repo is public-safe by construction: no absolute paths, personal email, machine names or secrets in code, docs, images or history. Commits use a GitHub `noreply` identity, the `.gitignore` blocks local tooling config and env files, source maps are off in production builds, and an automated script (`scripts/check-privacy.mjs`) scans files and history in CI and before each commit.

## License

[MIT](LICENSE)
