# Changelog

All notable changes are recorded here. Format follows Keep a Changelog; versions follow milestones until v1.0.

## [Unreleased]

### Added (M1)
- Deterministic 2048 engine in `shared/engine.ts`: slide/merge, seeded spawns (`randomAt`), win and game-over detection, `replay(seed, moves)`.
- 41 engine tests: slide/merge cases, directions, determinism, fairness, tile conservation, a 2000-move random game.
- Playable solo board: keyboard and swipe input, score and best score (local), game over and win overlays, retro pixel styling, number labels on every tile.

### Added (M0)
- M0: project scaffold (React + Vite client, Node + Socket.IO server stub, shared constants, Vitest).
- Privacy check script, pre-commit hook and CI workflow.
- README skeleton, project plan, dev log and first two decision records.
