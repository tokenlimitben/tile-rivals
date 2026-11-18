/** Values shared by the client, the server and the tests. */

export const BOARD_SIZE = 4;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const WIN_TILE = 2048;

/** Match formats (see docs/plan.md, "Versus mode"). */
export type MatchFormat = 'timed' | 'first-to-2048';

export const TIMED_MATCH_SECONDS = 120;
export const FIRST_TO_2048_CAP_SECONDS = 600;
