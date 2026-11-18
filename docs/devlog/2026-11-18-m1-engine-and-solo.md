# 2026-11-18: M1, engine and solo play

**Goal:** a correct, deterministic engine with tests, and a board you can actually play.

**Done**
- `shared/engine.ts`: pure functions over immutable state. Sliding is done one line at a time (`slideLine`), and `lineIndices` maps each direction onto the same code, so there is one merge implementation, not four.
- Spawns come from `randomAt(seed, n)`, a small integer hash. The Nth spawn of a match always sees the same random numbers, so two players on one seed face the same luck. `replay(seed, moves)` rebuilds a whole game, which will drive server validation and match replays later.
- Tests (43 total with the M0 smoke tests): slide and merge edge cases (merge once per tile, no chain merges), all four directions, no-op moves spawn nothing, tile total conserved apart from the spawn, win and game-over detection, determinism, the fairness property, and a 2000-move random game checking every tile stays a power of two.
- Solo UI in React: `useSoloGame` (reducer, best score, keep-going state), `useDirectionInput` (keydown for lowest latency, swipe with a 24px threshold, `touch-action: none` so swipes don't scroll), `Board`, overlays.
- Accessibility basics: every tile shows its number so colour is never the only signal, a live region announces the score, 44px minimum button height, and reduced-motion is respected.

**Verified in the browser:** keys and swipes move tiles, a no-op key press does not count as a move, a full random game reaches game over, the overlay appears, TRY AGAIN resets the board, and the best score persists in local storage. No console errors.

**Gotcha:** port 5173 was already in use by another dev server, so Vite silently moved to the next port. Fix: `npm run dev:client` now uses `--strictPort`, so a busy port is an error instead of a silent switch.

**Test I rewrote:** my first "game over" test asserted something that was always true. I replaced it with a hand-built board where one move leaves exactly one gap whose neighbours differ from both possible spawn values, so the board genuinely locks.

**Not yet (by design):** animations, sound, input buffering (M2).

**Next:** M2, game feel: tile slide and merge animations, spawn pop, chiptune sound, input buffering.
