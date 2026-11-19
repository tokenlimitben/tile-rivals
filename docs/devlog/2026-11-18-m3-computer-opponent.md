# 2026-11-18: M3, computer opponent

**Goal:** a beatable-to-brutal AI and a vs Computer mode where both sides face the same tiles.

**Done**
- `shared/ai.ts`: expectimax over the shared engine. Max nodes try each slide; chance nodes average over spawn cells (2 at 90%, 4 at 10%), sampling at most four cells to stay fast. The heuristic scores each row and column (empty cells, merge chances, monotonicity, a penalty for big tiles) and adds a bonus for the biggest tile in a corner. Line scores are cached in a typed array.
- Tiers differ in look-ahead, deliberate mistakes and move pace. Mistakes are drawn from the seeded stream rather than `Math.random`, so the AI is deterministic and testable.
- `shared/match.ts`: one `judge()` function decides both formats. First to build 2048 wins; both boards locked or time up goes to the higher score. The format only changes the clock length, so there is one match loop, as planned.
- UI: setup screen (difficulty, format), 3-2-1 countdown, side-by-side boards, match clock, result with rematch. The board logic moved into a `useBoardState` hook so the solo board and both match boards share it.
- Benchmark script (`npm run benchmark:ai`) plays 50 fixed-seed games per tier; results are in the README.

**Verified in the browser:** full Timed matches to the end on Hard (computer win by time), Easy (a genuine 1048 vs 1048 draw when both boards locked) and the setup, rematch and menu flow. No console errors.

**Tests (20 new, 75 total):** every tier plays only legal moves for a full game, same input gives same move, a merge-to-2048 position, heuristic ordering, tier ordering by average score (hard > medium > easy over 6 seeds), match rules for both formats including draws and the cap.

**Surprise:** Hard reaches 2048 in 76% of unlimited games, much stronger than I expected from three moves of look-ahead. That is fine because live pace limits it: at 260 ms a move it gets roughly 460 moves in a 2-minute race. The numbers are a first guess for the playtests to tune.

**Not yet:** the mobile layout stacks the computer's board under yours, so you scroll to see it (M6 polish); the floating "+N" can still overlap the SCORE label mid-animation; sound for the computer's board is off on purpose.
