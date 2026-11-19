import { useCallback, useEffect, useReducer } from 'react';
import type { Direction } from '../shared/engine';
import { sfx } from './audio';
import { boardReducer, freshBoard } from './gameState';

/** Tiles that slid into a merge stay in the DOM this long so the slide can finish. */
const SLIDE_MS = 140;
/** Merges at or above this value shake the board. */
const SHAKE_FROM = 256;

export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

/**
 * One animated board: game state, tile identities, cleanup of merged tiles and
 * (optionally) sound. Used for the solo board and for each side of a match.
 */
export function useBoardState(initialSeed: number, withSound: boolean) {
  const [state, dispatch] = useReducer(boardReducer, initialSeed, (s: number) => freshBoard(s));

  // Remove tiles that finished sliding into a merge.
  useEffect(() => {
    if (!state.tiles.some((t) => t.removing)) return;
    const timer = window.setTimeout(() => dispatch({ type: 'cleanup' }), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [state.tiles]);

  // Sound reacts to what just happened.
  const { event } = state;
  useEffect(() => {
    if (!withSound || event.n === 0) return;
    if (event.kind === 'start') sfx.click();
    else if (event.justOver) sfx.gameOver();
    else if (event.justWon) sfx.win();
    else if (event.mergeCount > 0) sfx.merge(event.maxMerged);
    else sfx.move();
  }, [event, withSound]);

  const onMove = useCallback((dir: Direction) => dispatch({ type: 'move', dir }), []);
  const reset = useCallback((seed: number) => dispatch({ type: 'new', seed }), []);

  return {
    game: state.game,
    tiles: state.tiles,
    event,
    onMove,
    reset,
    /** Changes (non-zero) whenever a big merge should shake the board. */
    shake: event.kind === 'move' && event.maxMerged >= SHAKE_FROM ? event.n : 0,
  };
}
