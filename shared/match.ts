/**
 * Match rules shared by the client and (later) the server.
 * One loop, two formats: the format only changes the clock and what ends the match.
 */

import { FIRST_TO_2048_CAP_SECONDS, TIMED_MATCH_SECONDS, type MatchFormat } from './constants';
import type { GameState } from './engine';

export type Side = 'a' | 'b';

export interface Outcome {
  /** null means a draw. */
  readonly winner: Side | null;
  readonly reason: 'reached-2048' | 'time-up' | 'boards-locked';
}

/** Length of the match clock for a format, in seconds. */
export function matchSeconds(format: MatchFormat): number {
  return format === 'timed' ? TIMED_MATCH_SECONDS : FIRST_TO_2048_CAP_SECONDS;
}

function byScore(a: GameState, b: GameState): Side | null {
  if (a.score === b.score) return null;
  return a.score > b.score ? 'a' : 'b';
}

/**
 * Decide whether the match is over. Call it after every move and every clock tick;
 * it returns null while play continues.
 *
 * - Reaching 2048 first wins in both formats (so the first player to do it is
 *   decided by whichever call sees it first; if both are seen at once, score decides).
 * - Time up, or both boards locked: highest score wins.
 */
export function judge(format: MatchFormat, elapsedMs: number, a: GameState, b: GameState): Outcome | null {
  if (a.won || b.won) {
    if (a.won && b.won) return { winner: byScore(a, b), reason: 'reached-2048' };
    return { winner: a.won ? 'a' : 'b', reason: 'reached-2048' };
  }
  if (a.over && b.over) return { winner: byScore(a, b), reason: 'boards-locked' };
  if (elapsedMs >= matchSeconds(format) * 1000) return { winner: byScore(a, b), reason: 'time-up' };
  return null;
}
