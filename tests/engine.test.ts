import { describe, expect, it } from 'vitest';
import {
  DIRECTIONS,
  hasMoves,
  lineIndices,
  maxTile,
  move,
  newGame,
  randomAt,
  replay,
  slideGrid,
  slideLine,
  type Direction,
  type GameState,
} from '../shared/engine';
import { WIN_TILE } from '../shared/constants';

const sum = (grid: readonly number[]) => grid.reduce((a, b) => a + b, 0);

/** Deterministic pseudo-random move list for property-style tests. */
function movesFor(seed: number, count: number): Direction[] {
  return Array.from({ length: count }, (_, i) => DIRECTIONS[Math.floor(randomAt(seed, 10_000 + i) * 4)]!);
}

describe('slideLine', () => {
  it.each([
    [[0, 0, 0, 0], [0, 0, 0, 0], 0],
    [[2, 0, 0, 0], [2, 0, 0, 0], 0],
    [[0, 0, 0, 2], [2, 0, 0, 0], 0],
    [[2, 2, 0, 0], [4, 0, 0, 0], 4],
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 2, 0], [4, 2, 0, 0], 4],
    [[4, 2, 2, 0], [4, 4, 0, 0], 4],
    [[2, 0, 2, 4], [4, 4, 0, 0], 4],
    [[2, 4, 8, 16], [2, 4, 8, 16], 0],
    [[4, 4, 8, 8], [8, 16, 0, 0], 24],
  ])('slides %j to %j gaining %i', (input, expected, gained) => {
    const result = slideLine(input);
    expect(result.line).toEqual(expected);
    expect(result.gained).toBe(gained);
  });

  it('merges each tile at most once per move', () => {
    // 4,2,2 -> the new 4 must not merge again with the existing 4.
    expect(slideLine([4, 2, 2, 0]).line).toEqual([4, 4, 0, 0]);
  });
});

describe('slideGrid directions', () => {
  // 0 0 0 2
  // 0 0 0 0
  // 0 0 0 0
  // 2 0 0 0
  const grid = [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0];

  it('moves left', () => {
    const { grid: g } = slideGrid(grid, 'left');
    expect(g[0]).toBe(2);
    expect(g[12]).toBe(2);
  });

  it('moves right', () => {
    const { grid: g } = slideGrid(grid, 'right');
    expect(g[3]).toBe(2);
    expect(g[15]).toBe(2);
  });

  it('moves up', () => {
    const { grid: g } = slideGrid(grid, 'up');
    expect(g[3]).toBe(2);
    expect(g[0]).toBe(2);
  });

  it('moves down', () => {
    const { grid: g } = slideGrid(grid, 'down');
    expect(g[15]).toBe(2);
    expect(g[12]).toBe(2);
  });

  it('merges vertically', () => {
    const col = [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = slideGrid(col, 'up');
    expect(result.grid[0]).toBe(4);
    expect(result.gained).toBe(4);
    expect(result.merged).toEqual([0]);
  });

  it('reports moved=false when nothing changes', () => {
    const packed = [2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(slideGrid(packed, 'left').moved).toBe(false);
  });

  it('covers every cell exactly once per direction', () => {
    for (const dir of DIRECTIONS) {
      const seen = new Set<number>();
      for (let i = 0; i < 4; i++) lineIndices(dir, i).forEach((j) => seen.add(j));
      expect(seen.size).toBe(16);
    }
  });
});

describe('hasMoves', () => {
  it('is true with an empty cell', () => {
    expect(hasMoves([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 0])).toBe(true);
  });

  it('is true with equal horizontal neighbours on a full board', () => {
    expect(hasMoves([2, 2, 4, 8, 4, 8, 2, 4, 2, 4, 8, 2, 8, 2, 4, 8])).toBe(true);
  });

  it('is true with equal vertical neighbours on a full board', () => {
    expect(hasMoves([2, 4, 2, 4, 2, 8, 4, 2, 4, 2, 8, 4, 8, 4, 2, 8])).toBe(true);
  });

  it('is false on a full checkerboard', () => {
    expect(hasMoves([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2])).toBe(false);
  });
});

describe('randomAt', () => {
  it('is deterministic', () => {
    expect(randomAt(123, 7)).toBe(randomAt(123, 7));
  });

  it('stays in [0, 1)', () => {
    for (let n = 0; n < 1000; n++) {
      const r = randomAt(42, n);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it('differs across seeds and indexes', () => {
    expect(randomAt(1, 0)).not.toBe(randomAt(2, 0));
    expect(randomAt(1, 0)).not.toBe(randomAt(1, 1));
  });

  it('is roughly uniform', () => {
    let low = 0;
    const n = 20_000;
    for (let i = 0; i < n; i++) if (randomAt(99, i) < 0.5) low++;
    expect(low / n).toBeGreaterThan(0.48);
    expect(low / n).toBeLessThan(0.52);
  });
});

describe('newGame', () => {
  it('starts with exactly two tiles, each a 2 or 4, and zero score', () => {
    const g = newGame(1);
    const tiles = g.grid.filter((v) => v !== 0);
    expect(tiles).toHaveLength(2);
    tiles.forEach((v) => expect([2, 4]).toContain(v));
    expect(g.score).toBe(0);
    expect(g.moves).toBe(0);
    expect(g.over).toBe(false);
    expect(g.won).toBe(false);
  });

  it('is identical for the same seed (the fairness guarantee)', () => {
    expect(newGame(2026)).toEqual(newGame(2026));
  });

  it('differs across seeds', () => {
    const grids = new Set(Array.from({ length: 20 }, (_, s) => newGame(s).grid.join(',')));
    expect(grids.size).toBeGreaterThan(10);
  });
});

describe('move', () => {
  it('does nothing and spawns nothing when the move is a no-op', () => {
    const g: GameState = { ...newGame(5), grid: [2, 4, 0, 0, ...new Array<number>(12).fill(0)] };
    const result = move(g, 'left');
    expect(result.moved).toBe(false);
    expect(result.state).toBe(g);
  });

  it('spawns exactly one tile after a move', () => {
    const g = newGame(11);
    const dir = DIRECTIONS.find((d) => move(g, d).moved)!;
    const result = move(g, dir);
    const before = g.grid.filter((v) => v !== 0).length;
    const after = result.state.grid.filter((v) => v !== 0).length;
    // Merges can reduce the count by one per merge; the spawn adds one.
    expect(after).toBe(before - result.merged.length + 1);
    expect(result.state.lastSpawn).toBeGreaterThanOrEqual(0);
    expect(result.state.moves).toBe(1);
  });

  it('adds merge values to the score', () => {
    const g: GameState = { ...newGame(3), grid: [2, 2, 4, 4, ...new Array<number>(12).fill(0)] };
    const result = move(g, 'left');
    expect(result.gained).toBe(12);
    expect(result.state.score).toBe(12);
  });

  it('conserves tile total apart from the spawned tile', () => {
    let state = newGame(77);
    for (const dir of movesFor(77, 200)) {
      const result = move(state, dir);
      if (!result.moved) continue;
      const spawned = sum(result.state.grid) - sum(state.grid);
      expect([2, 4]).toContain(spawned);
      state = result.state;
    }
  });

  it('detects the win tile and keeps won=true', () => {
    const g: GameState = {
      ...newGame(8),
      grid: [1024, 1024, 0, 0, ...new Array<number>(12).fill(0)],
    };
    const result = move(g, 'left');
    expect(maxTile(result.state.grid)).toBe(WIN_TILE);
    expect(result.state.won).toBe(true);
    const next = move(result.state, 'down');
    expect(next.state.won).toBe(true);
  });

  it('detects game over when a move fills the board with no merges left', () => {
    // Sliding right opens the only gap at index 12. Its neighbours (8 above, 16 beside)
    // differ from both possible spawn values (2 or 4), so the board locks.
    const almostLocked = [2, 4, 2, 4, 4, 2, 4, 2, 16, 4, 2, 4, 8, 32, 64, 0];
    const g: GameState = { ...newGame(9), grid: almostLocked };
    const result = move(g, 'right');
    expect(result.moved).toBe(true);
    expect(result.state.grid.every((v) => v !== 0)).toBe(true);
    expect(result.state.over).toBe(true);
  });

  it('is not over while a merge is still available', () => {
    const g: GameState = { ...newGame(9), grid: [2, 2, 4, 8, 4, 8, 2, 4, 2, 4, 8, 2, 8, 2, 4, 8] };
    expect(hasMoves(g.grid)).toBe(true);
    expect(g.over).toBe(false);
  });

  it('refuses moves once the game is over', () => {
    const locked: GameState = {
      ...newGame(4),
      grid: [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2],
      over: true,
    };
    for (const dir of DIRECTIONS) expect(move(locked, dir).moved).toBe(false);
  });

  it('is deterministic: same seed and moves give the same game', () => {
    const moves = movesFor(31, 300);
    expect(replay(31, moves)).toEqual(replay(31, moves));
  });

  it('gives two players with the same seed the same spawn value for the same spawn number', () => {
    // Players who choose different first moves end up with different boards, but the
    // tile spawned by their first move (spawn #3) has the same value for both.
    let compared = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const start = newGame(seed);
      const results = DIRECTIONS.map((d) => move(start, d)).filter((r) => r.moved);
      if (results.length < 2) continue;
      const [a, b] = [results[0]!.state, results[1]!.state];
      expect(a.spawnCount).toBe(b.spawnCount);
      expect(a.grid[a.lastSpawn]).toBe(b.grid[b.lastSpawn]);
      compared++;
    }
    expect(compared).toBeGreaterThan(20);
  });

  it('spawns a 2 about 90% of the time', () => {
    let twos = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) if (randomAt(1234, i * 2 + 1) < 0.9) twos++;
    expect(twos / n).toBeGreaterThan(0.88);
    expect(twos / n).toBeLessThan(0.92);
  });

  it('never exceeds the grid or produces invalid tiles over a long random game', () => {
    let state = newGame(2024);
    for (const dir of movesFor(2024, 2000)) {
      state = move(state, dir).state;
      expect(state.grid).toHaveLength(16);
      state.grid.forEach((v) => {
        expect(v === 0 || (v >= 2 && (v & (v - 1)) === 0)).toBe(true);
      });
    }
  });
});
