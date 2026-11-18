import type { MoveResult } from '../shared/engine';

/**
 * Animation-side model of the board. The engine only knows tile *values per cell*;
 * to animate slides we also need tile *identity*, so a tile keeps its id as it moves
 * and React/CSS can transition it from the old cell to the new one.
 *
 * This file is pure (no React, no DOM) so it can be unit tested against the engine.
 */

export interface TileModel {
  readonly id: number;
  readonly value: number;
  /** Grid index, row-major. */
  readonly index: number;
  /** Spawned by the last move: plays the spawn pop. */
  readonly isNew: boolean;
  /** Created by a merge in the last move: plays the merge pop. */
  readonly isMerged: boolean;
  /** Slid into a merge and is about to disappear. Removed after the slide finishes. */
  readonly removing: boolean;
}

export interface TileSet {
  readonly tiles: readonly TileModel[];
  readonly nextId: number;
}

export function tilesFromGrid(grid: readonly number[], nextId = 1): TileSet {
  const tiles: TileModel[] = [];
  let id = nextId;
  grid.forEach((value, index) => {
    if (value !== 0) {
      tiles.push({ id: id++, value, index, isNew: true, isMerged: false, removing: false });
    }
  });
  return { tiles, nextId: id };
}

export function liveTiles(tiles: readonly TileModel[]): TileModel[] {
  return tiles.filter((t) => !t.removing);
}

/** Carry the previous tiles through one engine move. */
export function applyMove(
  tiles: readonly TileModel[],
  result: MoveResult,
  nextId: number,
): TileSet {
  if (!result.moved) return { tiles, nextId };

  // Tiles still fading out from the previous move are dropped right away.
  const byIndex = new Map(liveTiles(tiles).map((t) => [t.index, t]));

  const sources = new Map<number, number[]>(); // destination -> source indexes
  for (const { from, to } of result.shifts) {
    const list = sources.get(to);
    if (list) list.push(from);
    else sources.set(to, [from]);
  }

  const out: TileModel[] = [];
  let id = nextId;

  for (const [to, froms] of sources) {
    const first = byIndex.get(froms[0]!);
    if (!first) continue; // cannot happen when tiles are in sync with the engine
    if (froms.length === 2) {
      const second = byIndex.get(froms[1]!)!;
      out.push({ ...first, index: to, isNew: false, isMerged: false, removing: true });
      out.push({ ...second, index: to, isNew: false, isMerged: false, removing: true });
      out.push({
        id: id++,
        value: first.value * 2,
        index: to,
        isNew: false,
        isMerged: true,
        removing: false,
      });
    } else {
      out.push({ ...first, index: to, isNew: false, isMerged: false });
    }
  }

  const spawnIndex = result.state.lastSpawn;
  if (spawnIndex >= 0) {
    out.push({
      id: id++,
      value: result.state.grid[spawnIndex]!,
      index: spawnIndex,
      isNew: true,
      isMerged: false,
      removing: false,
    });
  }

  out.sort((a, b) => a.id - b.id); // stable DOM order, so React reuses elements
  return { tiles: out, nextId: id };
}

export function dropRemoving(tiles: readonly TileModel[]): readonly TileModel[] {
  return tiles.some((t) => t.removing) ? liveTiles(tiles) : tiles;
}
