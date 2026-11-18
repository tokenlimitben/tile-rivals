/**
 * Deterministic 2048 engine.
 *
 * Pure functions over immutable state, with no DOM or Node APIs, so the same code
 * runs in the browser (prediction), on the server (authority) and in tests.
 *
 * Fairness: tile spawns are driven by `randomAt(seed, n)`, a hash of the match seed
 * and the spawn counter. Two players with the same seed see the same random
 * numbers, and a whole game can be replayed from `seed + moves`.
 */

import { BOARD_SIZE, CELL_COUNT, WIN_TILE } from './constants';

export type Direction = 'up' | 'right' | 'down' | 'left';
export const DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left'];

export interface GameState {
  /** Row-major tile values; 0 is empty. */
  readonly grid: readonly number[];
  readonly score: number;
  readonly seed: number;
  /** How many tiles have spawned so far; indexes into the seeded random stream. */
  readonly spawnCount: number;
  /** Number of moves that changed the board. */
  readonly moves: number;
  /** True once a WIN_TILE (or higher) has been built. Stays true. */
  readonly won: boolean;
  /** True when no move is possible. */
  readonly over: boolean;
  /** Grid index of the tile spawned by the last move, or -1. For animation. */
  readonly lastSpawn: number;
}

export interface MoveResult {
  readonly state: GameState;
  /** False when the direction changed nothing (no spawn, no move counted). */
  readonly moved: boolean;
  readonly gained: number;
  /** Grid indexes where two tiles merged this move. For animation. */
  readonly merged: readonly number[];
}

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

/** Deterministic float in [0, 1) for a (seed, n) pair. */
export function randomAt(seed: number, n: number): number {
  let t = ((seed >>> 0) + Math.imul(n + 1, 0x9e3779b9)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Sliding and merging
// ---------------------------------------------------------------------------

/**
 * Slide one line toward index 0 and merge equal neighbours once per tile.
 * `mergedAt` holds the output positions that were created by a merge.
 */
export function slideLine(line: readonly number[]): {
  line: number[];
  gained: number;
  mergedAt: number[];
} {
  const tiles = line.filter((v) => v !== 0);
  const out: number[] = [];
  const mergedAt: number[] = [];
  let gained = 0;

  for (let i = 0; i < tiles.length; i++) {
    const current = tiles[i]!;
    if (tiles[i + 1] === current) {
      out.push(current * 2);
      gained += current * 2;
      mergedAt.push(out.length - 1);
      i++; // the next tile was consumed by the merge
    } else {
      out.push(current);
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained, mergedAt };
}

/** Grid indexes of line `i` for a direction, ordered from the edge tiles slide toward. */
export function lineIndices(dir: Direction, i: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < BOARD_SIZE; k++) {
    switch (dir) {
      case 'left':
        out.push(i * BOARD_SIZE + k);
        break;
      case 'right':
        out.push(i * BOARD_SIZE + (BOARD_SIZE - 1 - k));
        break;
      case 'up':
        out.push(k * BOARD_SIZE + i);
        break;
      case 'down':
        out.push((BOARD_SIZE - 1 - k) * BOARD_SIZE + i);
        break;
    }
  }
  return out;
}

/** Slide a whole grid. Pure and spawn-free; the AI uses this directly. */
export function slideGrid(
  grid: readonly number[],
  dir: Direction,
): { grid: number[]; gained: number; moved: boolean; merged: number[] } {
  const next = grid.slice();
  const merged: number[] = [];
  let gained = 0;
  let moved = false;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const idx = lineIndices(dir, i);
    const result = slideLine(idx.map((j) => grid[j]!));
    gained += result.gained;
    idx.forEach((j, k) => {
      if (next[j] !== result.line[k]) moved = true;
      next[j] = result.line[k]!;
    });
    for (const k of result.mergedAt) merged.push(idx[k]!);
  }
  return { grid: next, gained, moved, merged };
}

/** True if any move is possible: an empty cell or two equal neighbours. */
export function hasMoves(grid: readonly number[]): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r * BOARD_SIZE + c]!;
      if (v === 0) return true;
      if (c + 1 < BOARD_SIZE && grid[r * BOARD_SIZE + c + 1] === v) return true;
      if (r + 1 < BOARD_SIZE && grid[(r + 1) * BOARD_SIZE + c] === v) return true;
    }
  }
  return false;
}

export function maxTile(grid: readonly number[]): number {
  return grid.reduce((a, b) => (b > a ? b : a), 0);
}

// ---------------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------------

/** Place a 2 (90%) or 4 (10%) on a seeded-random empty cell. Null if the board is full. */
function spawnTile(
  grid: readonly number[],
  seed: number,
  spawnCount: number,
): { grid: number[]; index: number } | null {
  const empties: number[] = [];
  grid.forEach((v, i) => {
    if (v === 0) empties.push(i);
  });
  if (empties.length === 0) return null;

  const index = empties[Math.floor(randomAt(seed, spawnCount * 2) * empties.length)]!;
  const value = randomAt(seed, spawnCount * 2 + 1) < 0.9 ? 2 : 4;
  const next = grid.slice();
  next[index] = value;
  return { grid: next, index };
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------

export function newGame(seed: number): GameState {
  const normalized = seed >>> 0;
  let grid: number[] = new Array<number>(CELL_COUNT).fill(0);
  let spawnCount = 0;
  let lastSpawn = -1;

  for (let i = 0; i < 2; i++) {
    const spawned = spawnTile(grid, normalized, spawnCount)!;
    grid = spawned.grid;
    lastSpawn = spawned.index;
    spawnCount++;
  }

  return {
    grid,
    score: 0,
    seed: normalized,
    spawnCount,
    moves: 0,
    won: false,
    over: !hasMoves(grid),
    lastSpawn,
  };
}

/** Apply one move. Returns the same state (moved: false) if the move changes nothing. */
export function move(state: GameState, dir: Direction): MoveResult {
  if (state.over) return { state, moved: false, gained: 0, merged: [] };

  const slid = slideGrid(state.grid, dir);
  if (!slid.moved) return { state, moved: false, gained: 0, merged: [] };

  const spawned = spawnTile(slid.grid, state.seed, state.spawnCount);
  const grid = spawned ? spawned.grid : slid.grid;

  return {
    moved: true,
    gained: slid.gained,
    merged: slid.merged,
    state: {
      grid,
      score: state.score + slid.gained,
      seed: state.seed,
      spawnCount: state.spawnCount + (spawned ? 1 : 0),
      moves: state.moves + 1,
      won: state.won || maxTile(grid) >= WIN_TILE,
      over: !hasMoves(grid),
      lastSpawn: spawned ? spawned.index : -1,
    },
  };
}

/** Rebuild a game from its seed and move list. Moves that change nothing are skipped. */
export function replay(seed: number, moves: readonly Direction[]): GameState {
  let state = newGame(seed);
  for (const dir of moves) state = move(state, dir).state;
  return state;
}
