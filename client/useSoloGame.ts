import { useCallback, useEffect, useState } from 'react';
import { readNumber, writeNumber } from './storage';
import { randomSeed, useBoardState } from './useBoardState';

const BEST_KEY = 'tilerivals.solo.best';

export function useSoloGame() {
  const board = useBoardState(randomSeed(), true);
  const { game, reset } = board;
  const [best, setBest] = useState(() => readNumber(BEST_KEY));
  // After reaching 2048 the player may choose to keep playing.
  const [keepGoing, setKeepGoing] = useState(false);

  useEffect(() => {
    if (game.score > best) {
      setBest(game.score);
      writeNumber(BEST_KEY, game.score);
    }
  }, [game.score, best]);

  const onNewGame = useCallback(() => {
    reset(randomSeed());
    setKeepGoing(false);
  }, [reset]);

  return {
    ...board,
    best,
    onNewGame,
    showWin: game.won && !keepGoing,
    onKeepGoing: () => setKeepGoing(true),
  };
}
