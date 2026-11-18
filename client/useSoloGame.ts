import { useCallback, useEffect, useReducer, useState } from 'react';
import { move, newGame, type Direction, type GameState } from '../shared/engine';
import { sfx } from './audio';
import { readNumber, writeNumber } from './storage';
import { applyMove, dropRemoving, tilesFromGrid, type TileModel } from './tiles';

const BEST_KEY = 'versus2048.solo.best';
/** Tiles that slid into a merge stay in the DOM this long so the slide can finish. */
const SLIDE_MS = 140;
/** Merges at or above this value shake the board. */
const SHAKE_FROM = 256;

function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

/** What the last action did. The UI reacts to it (sound, score pop, shake). */
interface GameEvent {
  /** Increments on every state-changing action; 0 means the initial board. */
  readonly n: number;
  readonly kind: 'start' | 'move';
  readonly gained: number;
  readonly mergeCount: number;
  readonly maxMerged: number;
  readonly justWon: boolean;
  readonly justOver: boolean;
}

interface SoloState {
  readonly game: GameState;
  readonly tiles: readonly TileModel[];
  readonly nextId: number;
  readonly event: GameEvent;
}

type Action = { type: 'move'; dir: Direction } | { type: 'new' } | { type: 'cleanup' };

function fresh(prevEventN: number): SoloState {
  const game = newGame(randomSeed());
  const { tiles, nextId } = tilesFromGrid(game.grid);
  return {
    game,
    tiles,
    nextId,
    event: { n: prevEventN, kind: 'start', gained: 0, mergeCount: 0, maxMerged: 0, justWon: false, justOver: false },
  };
}

function reducer(state: SoloState, action: Action): SoloState {
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
      return fresh(state.event.n + 1);
    case 'cleanup': {
      const tiles = dropRemoving(state.tiles);
      return tiles === state.tiles ? state : { ...state, tiles };
    }
  }
}

export function useSoloGame() {
  const [state, dispatch] = useReducer(reducer, 0, fresh);
  const [best, setBest] = useState(() => readNumber(BEST_KEY));
  // After reaching 2048 the player may choose to keep playing.
  const [keepGoing, setKeepGoing] = useState(false);

  useEffect(() => {
    if (state.game.score > best) {
      setBest(state.game.score);
      writeNumber(BEST_KEY, state.game.score);
    }
  }, [state.game.score, best]);

  // Remove tiles that finished sliding into a merge.
  useEffect(() => {
    if (!state.tiles.some((t) => t.removing)) return;
    const timer = window.setTimeout(() => dispatch({ type: 'cleanup' }), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [state.tiles]);

  // Sound reacts to what just happened.
  const { event } = state;
  useEffect(() => {
    if (event.n === 0) return;
    if (event.kind === 'start') sfx.click();
    else if (event.justOver) sfx.gameOver();
    else if (event.justWon) sfx.win();
    else if (event.mergeCount > 0) sfx.merge(event.maxMerged);
    else sfx.move();
  }, [event]);

  const onMove = useCallback((dir: Direction) => dispatch({ type: 'move', dir }), []);
  const onNewGame = useCallback(() => {
    dispatch({ type: 'new' });
    setKeepGoing(false);
  }, []);

  return {
    game: state.game,
    tiles: state.tiles,
    event,
    best,
    onMove,
    onNewGame,
    /** Changes (non-zero) whenever a big merge should shake the board. */
    shake: event.kind === 'move' && event.maxMerged >= SHAKE_FROM ? event.n : 0,
    showWin: state.game.won && !keepGoing,
    onKeepGoing: () => setKeepGoing(true),
  };
}
