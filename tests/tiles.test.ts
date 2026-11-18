import { describe, expect, it } from 'vitest';
import { DIRECTIONS, move, newGame, randomAt, slideGrid, slideLine } from '../shared/engine';
import { applyMove, dropRemoving, liveTiles, tilesFromGrid } from '../client/tiles';

describe('engine shifts', () => {
  it('reports one shift per non-empty input tile', () => {
    const r = slideLine([2, 0, 2, 4]);
    expect(r.shifts).toEqual([
      { from: 0, to: 0 },
      { from: 2, to: 0 },
      { from: 3, to: 1 },
    ]);
  });

  it('sends both merged tiles to the same destination', () => {
    const { shifts } = slideLine([4, 4, 2, 0]);
    expect(shifts.filter((s) => s.to === 0)).toHaveLength(2);
  });

  it('maps line positions back to grid indexes for every direction', () => {
    const grid = [0, 2, 0, 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4];
    for (const dir of DIRECTIONS) {
      const { shifts } = slideGrid(grid, dir);
      const sources = shifts.map((s) => s.from).sort((a, b) => a - b);
      const nonEmpty = grid.flatMap((v, i) => (v ? [i] : []));
      expect(sources).toEqual(nonEmpty);
    }
  });
});

describe('tile tracking', () => {
  it('creates one tile per non-empty cell', () => {
    const game = newGame(1);
    const { tiles } = tilesFromGrid(game.grid);
    expect(tiles).toHaveLength(game.grid.filter(Boolean).length);
    tiles.forEach((t) => expect(game.grid[t.index]).toBe(t.value));
  });

  it('keeps a sliding tile\'s id so the move can be animated', () => {
    const game = { ...newGame(1), grid: [0, 0, 0, 2, ...new Array<number>(12).fill(0)] };
    const start = tilesFromGrid(game.grid);
    const result = move(game, 'left');
    const next = applyMove(start.tiles, result, start.nextId);
    const mover = next.tiles.find((t) => t.id === start.tiles[0]!.id)!;
    expect(mover.index).toBe(0);
    expect(mover.removing).toBe(false);
  });

  it('turns a merge into two fading tiles plus one new merged tile', () => {
    const game = { ...newGame(1), grid: [2, 2, 0, 0, ...new Array<number>(12).fill(0)] };
    const start = tilesFromGrid(game.grid);
    const result = move(game, 'left');
    const next = applyMove(start.tiles, result, start.nextId);

    const removing = next.tiles.filter((t) => t.removing);
    const merged = next.tiles.filter((t) => t.isMerged);
    expect(removing).toHaveLength(2);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.value).toBe(4);
    expect(merged[0]!.index).toBe(0);
    expect(dropRemoving(next.tiles)).toHaveLength(next.tiles.length - 2);
  });

  it('marks exactly one spawned tile after a move', () => {
    const game = newGame(3);
    const dir = DIRECTIONS.find((d) => move(game, d).moved)!;
    const start = tilesFromGrid(game.grid);
    const next = applyMove(start.tiles, move(game, dir), start.nextId);
    expect(next.tiles.filter((t) => t.isNew)).toHaveLength(1);
  });

  it('leaves tiles untouched when the move changes nothing', () => {
    const game = { ...newGame(1), grid: [2, 4, 0, 0, ...new Array<number>(12).fill(0)] };
    const start = tilesFromGrid(game.grid);
    const result = move(game, 'left');
    expect(applyMove(start.tiles, result, start.nextId).tiles).toBe(start.tiles);
  });

  it('stays in sync with the engine grid over many random games (fuzz)', () => {
    for (let seed = 1; seed <= 25; seed++) {
      let state = newGame(seed);
      let set = tilesFromGrid(state.grid);

      for (let i = 0; i < 400 && !state.over; i++) {
        const dir = DIRECTIONS[Math.floor(randomAt(seed, 50_000 + i) * 4)]!;
        const result = move(state, dir);
        set = applyMove(set.tiles, result, set.nextId);
        state = result.state;

        // Live tiles must describe exactly the engine's grid.
        const rebuilt = new Array<number>(16).fill(0);
        for (const t of liveTiles(set.tiles)) {
          expect(rebuilt[t.index]).toBe(0); // no two live tiles share a cell
          rebuilt[t.index] = t.value;
        }
        expect(rebuilt).toEqual([...state.grid]);

        // Ids are unique.
        const ids = set.tiles.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});
