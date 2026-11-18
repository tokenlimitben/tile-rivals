import { useCallback, useEffect, useReducer, useState } from 'react';
import { move, newGame, type Direction, type GameState } from '../shared/engine';
import { readNumber, writeNumber } from './storage';

const BEST_KEY = 'versus2048.solo.best';

function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

type Action = { type: 'move'; dir: Direction } | { type: 'new' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'move':
      return move(state, action.dir).state;
    case 'new':
      return newGame(randomSeed());
  }
}

export function useSoloGame() {
  const [state, dispatch] = useReducer(reducer, undefined, () => newGame(randomSeed()));
  const [best, setBest] = useState(() => readNumber(BEST_KEY));
  // After reaching 2048 the player may choose to keep playing.
  const [keepGoing, setKeepGoing] = useState(false);

  useEffect(() => {
    if (state.score > best) {
      setBest(state.score);
      writeNumber(BEST_KEY, state.score);
    }
  }, [state.score, best]);

  const onMove = useCallback((dir: Direction) => dispatch({ type: 'move', dir }), []);
  const onNewGame = useCallback(() => {
    dispatch({ type: 'new' });
    setKeepGoing(false);
  }, []);

  return {
    state,
    best,
    onMove,
    onNewGame,
    showWin: state.won && !keepGoing,
    onKeepGoing: () => setKeepGoing(true),
  };
}
