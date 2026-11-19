/**
 * Computer opponent: expectimax search over the shared engine.
 *
 * Pure and deterministic (mistakes are drawn from the seeded stream, not
 * Math.random), so a given board always gets the same answer and tests are stable.
 * No DOM or Node APIs, so it runs in the browser, on the server and in tests.
 */

import { BOARD_SIZE } from './constants';
import { DIRECTIONS, randomAt, slideGrid, type Direction, type GameState } from './engine';

export type AiTier = 'easy' | 'medium' | 'hard';
export const AI_TIERS: readonly AiTier[] = ['easy', 'medium', 'hard'];

export interface AiConfig {
  /** How many of its own moves the AI looks ahead (1 = greedy). */
  readonly depth: number;
  /** Chance of ignoring the search and playing a random legal move. */
  readonly mistake: number;
  /** At most this many empty cells are considered at each chance node. */
  readonly sampleCells: number;
  /** Milliseconds between moves in a live match, so it feels human and beatable. */
  readonly paceMs: number;
}

export const AI_CONFIG: Readonly<Record<AiTier, AiConfig>> = {
  easy: { depth: 1, mistake: 0.3, sampleCells: 4, paceMs: 650 },
  medium: { depth: 2, mistake: 0.08, sampleCells: 4, paceMs: 420 },
  hard: { depth: 3, mistake: 0, sampleCells: 4, paceMs: 260 },
};

// ---------------------------------------------------------------------------
// Heuristic
// ---------------------------------------------------------------------------

const LOSS = -1e9;
const EMPTY_W = 270;
const MERGE_W = 700;
const MONO_W = 47;
const SUM_W = 11;
const CORNER_W = 400;
const RANK_BASE = 18; // tile ranks 0..17 (2^17 = 131072)

/** Rank is log2 of the tile value, 0 for empty. */
function rank(v: number): number {
  return v === 0 ? 0 : 31 - Math.clz32(v);
}

/** Score one line of four ranks. Cached because the same lines recur constantly. */
const lineCache = new Float64Array(RANK_BASE ** BOARD_SIZE).fill(NaN);

function scoreLine(a: number, b: number, c: number, d: number): number {
  const key = ((a * RANK_BASE + b) * RANK_BASE + c) * RANK_BASE + d;
  const cached = lineCache[key]!;
  if (!Number.isNaN(cached)) return cached;

  const line = [a, b, c, d];
  let empty = 0;
  let merges = 0;
  let sum = 0;
  let prev = 0;
  let counter = 0;
  for (const r of line) {
    sum += r ** 3.5;
    if (r === 0) {
      empty++;
    } else {
      if (prev === r) counter++;
      else if (counter > 0) {
        merges += 1 + counter;
        counter = 0;
      }
      prev = r;
    }
  }
  if (counter > 0) merges += 1 + counter;

  // Monotonicity: a line that only rises or only falls is easy to merge later.
  let monoLeft = 0;
  let monoRight = 0;
  for (let i = 1; i < BOARD_SIZE; i++) {
    const x = line[i - 1]!;
    const y = line[i]!;
    if (x > y) monoLeft += x ** 4 - y ** 4;
    else monoRight += y ** 4 - x ** 4;
  }

  const value = EMPTY_W * empty + MERGE_W * merges - MONO_W * Math.min(monoLeft, monoRight) - SUM_W * sum;
  lineCache[key] = value;
  return value;
}

/** Static evaluation of a board: higher is better for the player. */
export function evaluate(grid: readonly number[]): number {
  const r = grid.map(rank);
  let total = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    total += scoreLine(r[i * 4]!, r[i * 4 + 1]!, r[i * 4 + 2]!, r[i * 4 + 3]!);
    total += scoreLine(r[i]!, r[4 + i]!, r[8 + i]!, r[12 + i]!);
  }
  // Keep the biggest tile in a corner.
  const top = Math.max(...r);
  if (r[0] === top || r[3] === top || r[12] === top || r[15] === top) total += CORNER_W * top;
  return total;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Best achievable value when it is the player's turn. */
function maxNode(grid: readonly number[], depth: number, cfg: AiConfig): number {
  let best = LOSS;
  for (const dir of DIRECTIONS) {
    const slid = slideGrid(grid, dir);
    if (!slid.moved) continue;
    const v = chanceNode(slid.grid, depth - 1, cfg);
    if (v > best) best = v;
  }
  return best; // LOSS when no move is possible
}

/** Expected value after the game drops a random tile. Depth 0 just evaluates. */
function chanceNode(grid: readonly number[], depth: number, cfg: AiConfig): number {
  if (depth <= 0) return evaluate(grid);

  const empties: number[] = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0) empties.push(i);
  if (empties.length === 0) return evaluate(grid);

  // Sample evenly spaced cells when there are many, to keep the search fast.
  let cells = empties;
  if (empties.length > cfg.sampleCells) {
    cells = [];
    const step = empties.length / cfg.sampleCells;
    for (let i = 0; i < cfg.sampleCells; i++) cells.push(empties[Math.floor(i * step)]!);
  }

  const next = grid.slice();
  let total = 0;
  for (const cell of cells) {
    next[cell] = 2;
    total += 0.9 * maxNode(next, depth, cfg);
    next[cell] = 4;
    total += 0.1 * maxNode(next, depth, cfg);
    next[cell] = 0;
  }
  return total / cells.length;
}

/** Moves that actually change the board. */
export function legalMoves(grid: readonly number[]): Direction[] {
  return DIRECTIONS.filter((dir) => slideGrid(grid, dir).moved);
}

/**
 * Choose a move for the given tier. Returns null only when the game is over.
 * Deterministic: the same state and tier always give the same move.
 */
export function chooseMove(state: GameState, tier: AiTier): Direction | null {
  if (state.over) return null;
  const legal = legalMoves(state.grid);
  if (legal.length === 0) return null;

  const cfg = AI_CONFIG[tier];
  // Separate stream from the spawn stream: offset the seed so mistakes don't correlate with spawns.
  if (cfg.mistake > 0 && randomAt(state.seed ^ 0x5bd1e995, state.moves * 2) < cfg.mistake) {
    return legal[Math.floor(randomAt(state.seed ^ 0x5bd1e995, state.moves * 2 + 1) * legal.length)]!;
  }

  let bestDir = legal[0]!;
  let bestValue = -Infinity;
  for (const dir of legal) {
    const v = chanceNode(slideGrid(state.grid, dir).grid, cfg.depth - 1, cfg);
    if (v > bestValue) {
      bestValue = v;
      bestDir = dir;
    }
  }
  return bestDir;
}
