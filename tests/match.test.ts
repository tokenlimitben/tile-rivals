import { describe, expect, it } from 'vitest';
import { FIRST_TO_2048_CAP_SECONDS, TIMED_MATCH_SECONDS } from '../shared/constants';
import { newGame, type GameState } from '../shared/engine';
import { judge, matchSeconds } from '../shared/match';

const base = newGame(1);
const g = (patch: Partial<GameState>): GameState => ({ ...base, ...patch });

describe('judge', () => {
  it('keeps playing while nobody has won, time remains and a board is open', () => {
    expect(judge('timed', 1000, g({}), g({}))).toBeNull();
    expect(judge('first-to-2048', 1000, g({}), g({}))).toBeNull();
  });

  it('timed: highest score wins when time is up', () => {
    const out = judge('timed', TIMED_MATCH_SECONDS * 1000, g({ score: 500 }), g({ score: 800 }));
    expect(out).toEqual({ winner: 'b', reason: 'time-up' });
  });

  it('timed: equal scores at time-up is a draw', () => {
    expect(judge('timed', TIMED_MATCH_SECONDS * 1000, g({ score: 5 }), g({ score: 5 }))?.winner).toBeNull();
  });

  it('first-to-2048 is not over at the timed-race length', () => {
    expect(judge('first-to-2048', TIMED_MATCH_SECONDS * 1000, g({}), g({}))).toBeNull();
  });

  it('first-to-2048: the 10-minute cap decides by score', () => {
    const out = judge('first-to-2048', FIRST_TO_2048_CAP_SECONDS * 1000, g({ score: 900 }), g({ score: 100 }));
    expect(out).toEqual({ winner: 'a', reason: 'time-up' });
  });

  it('reaching 2048 wins instantly in either format', () => {
    for (const format of ['timed', 'first-to-2048'] as const) {
      expect(judge(format, 5000, g({ won: true, score: 1 }), g({ score: 99999 }))).toEqual({
        winner: 'a',
        reason: 'reached-2048',
      });
      expect(judge(format, 5000, g({ score: 99999 }), g({ won: true }))?.winner).toBe('b');
    }
  });

  it('both locked ends the match early, highest score wins', () => {
    const out = judge('timed', 10_000, g({ over: true, score: 300 }), g({ over: true, score: 200 }));
    expect(out).toEqual({ winner: 'a', reason: 'boards-locked' });
  });

  it('one locked board does not end the match while the other can still play', () => {
    expect(judge('timed', 10_000, g({ over: true }), g({}))).toBeNull();
  });

  it('matchSeconds reflects the format', () => {
    expect(matchSeconds('timed')).toBe(TIMED_MATCH_SECONDS);
    expect(matchSeconds('first-to-2048')).toBe(FIRST_TO_2048_CAP_SECONDS);
  });
});
