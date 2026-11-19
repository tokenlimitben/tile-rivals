import { move, newGame, type Direction, type GameState } from '../shared/engine';
import { applyMove, dropRemoving, tilesFromGrid, type TileModel } from './tiles';

/** What the last action did. The UI reacts to it (sound, score pop, shake). */
export interface GameEvent {
  /** Increments on every state-changing action; 0 means the initial board. */
  readonly n: number;
  readonly kind: 'start' | 'move';
  readonly gained: number;
  readonly mergeCount: number;
  readonly maxMerged: number;
  readonly justWon: boolean;
  readonly justOver: boolean;
}

export interface BoardState {
  readonly game: GameState;
  readonly tiles: readonly TileModel[];
  readonly nextId: number;
  readonly event: GameEvent;
}

export type BoardAction =
  | { type: 'move'; dir: Direction }
  | { type: 'new'; seed: number }
  | { type: 'cleanup' };

export function freshBoard(seed: number, prevEventN = 0): BoardState {
  const game = newGame(seed);
  const { tiles, nextId } = tilesFromGrid(game.grid);
  return {
    game,
    tiles,
    nextId,
    event: { n: prevEventN, kind: 'start', gained: 0, mergeCount: 0, maxMerged: 0, justWon: false, justOver: false },
  };
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'move': {
      const result = move(state.game, action.dir);
      if (!result.moved) return state; // no-op: no sound, no animation, no move counted
      const { tiles, nextId } = applyMove(state.tiles, result, state.nextId);
      return {
        game: result.state,
        tiles,
        nextId,
        event: {
          n: state.event.n + 1,
          kind: 'move',
          gained: result.gained,
          mergeCount: result.merged.length,
          maxMerged: Math.max(0, ...result.merged.map((i) => result.state.grid[i]!)),
          justWon: result.state.won && !state.game.won,
          justOver: result.state.over,
        },
      };
    }
    case 'new':
      return freshBoard(action.seed, state.event.n + 1);
    case 'cleanup': {
      const tiles = dropRemoving(state.tiles);
      return tiles === state.tiles ? state : { ...state, tiles };
    }
  }
}
