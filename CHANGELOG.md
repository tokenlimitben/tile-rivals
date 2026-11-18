# Changelog

All notable changes are recorded here. Format follows Keep a Changelog; versions follow milestones until v1.0.

## [Unreleased]

### Added (M2)
- Engine now reports where every tile went (`shifts`) so the UI can animate slides and merges.
- Tile tracking (`client/tiles.ts`): tiles keep their identity across moves; fuzz-tested against the engine grid.
- Animated board: tiles are CSS-transform positioned, with slide, spawn-pop and merge-pop animations, a floating score gain, and a shake on merges of 256 or more.
- Chiptune sound effects synthesized with the Web Audio API (no audio files); merge pitch follows a pentatonic scale and rises with tile value.
- Settings for sound and reduced motion, saved locally; reduced motion defaults to the OS preference and also disables the shake.
- 12 new tests (55 total).

### Added (M1)
- Deterministic 2048 engine in `shared/engine.ts`: slide/merge, seeded spawns (`randomAt`), win and game-over detection, `replay(seed, moves)`.
- 41 engine tests: slide/merge cases, directions, determinism, fairness, tile conservation, a 2000-move random game.
- Playable solo board: keyboard and swipe input, score and best score (local), game over and win overlays, retro pixel styling, number labels on every tile.

### Added (M0)
- M0: project scaffold (React + Vite client, Node + Socket.IO server stub, shared constants, Vitest).
- Privacy check script, pre-commit hook and CI workflow.
- README skeleton, project plan, dev log and first two decision records.
