import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_CONFIG, chooseMove, type AiTier } from '../shared/ai';
import type { MatchFormat } from '../shared/constants';
import { judge, matchSeconds, type Outcome } from '../shared/match';
import { sfx } from './audio';
import { useBoardState } from './useBoardState';

const COUNTDOWN_STEPS = 3;
const COUNTDOWN_STEP_MS = 700;
const CLOCK_TICK_MS = 200;

export type Phase = 'countdown' | 'playing' | 'finished';

/**
 * One match against the computer. Both sides start from the same seed, so they get
 * identical spawn luck; the clock, the AI's pace and the result all live here.
 * Mount it with a fresh `key` for each match (rematch = new key + new seed).
 */
export function useVersusMatch(seed: number, tier: AiTier, format: MatchFormat) {
  const player = useBoardState(seed, true);
  const rival = useBoardState(seed, false);

  const [count, setCount] = useState(COUNTDOWN_STEPS);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const startedAt = useRef(0);

  // 3, 2, 1, then play.
  useEffect(() => {
    if (phase !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (count > 1) {
        setCount(count - 1);
        sfx.move();
      } else {
        startedAt.current = performance.now();
        setPhase('playing');
        sfx.click();
      }
    }, COUNTDOWN_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [phase, count]);

  // The match clock.
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt.current);
    }, CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Check for a result after every move and every clock tick.
  useEffect(() => {
    if (phase !== 'playing') return;
    const result = judge(format, elapsedMs, player.game, rival.game);
    if (result) {
      setOutcome(result);
      setPhase('finished');
      if (result.winner === 'a') sfx.win();
      else sfx.gameOver();
    }
  }, [phase, format, elapsedMs, player.game, rival.game]);

  // The computer moves at its tier's pace. Re-armed after each of its own moves.
  const rivalGame = rival.game;
  const rivalMove = rival.onMove;
  useEffect(() => {
    if (phase !== 'playing' || rivalGame.over) return;
    const timer = window.setTimeout(() => {
      const dir = chooseMove(rivalGame, tier);
      if (dir) rivalMove(dir);
    }, AI_CONFIG[tier].paceMs);
    return () => window.clearTimeout(timer);
  }, [phase, rivalGame, tier, rivalMove]);

  const remainingMs = Math.max(0, matchSeconds(format) * 1000 - elapsedMs);
  const canMove = phase === 'playing' && !player.game.over;
  const onMove = useCallback(
    (dir: Parameters<typeof player.onMove>[0]) => {
      if (canMove) player.onMove(dir);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canMove, player.onMove],
  );

  return { player, rival, phase, count, outcome, remainingMs, canMove, onMove };
}
