import { describe, expect, it } from 'vitest';
import { AI_CONFIG, AI_TIERS, chooseMove, evaluate, legalMoves } from '../shared/ai';
import { maxTile, move, newGame, type GameState } from '../shared/engine';

function play(seed: number, tier: 'easy' | 'medium' | 'hard', maxMoves: number): GameState {
  let state = newGame(seed);
  for (let i = 0; i < maxMoves && !state.over; i++) {
    const dir = chooseMove(state, tier);
    if (!dir) break;
    state = move(state, dir).state;
  }
  return state;
}

describe('computer opponent', () => {
  it.each(AI_TIERS)('%s only ever plays legal moves, for a whole game', (tier) => {
    let state = newGame(7);
    for (let i = 0; i < 3000 && !state.over; i++) {
      const dir = chooseMove(state, tier);
      expect(dir).not.toBeNull();
      const result = move(state, dir!);
      expect(result.moved).toBe(true);
      state = result.state;
    }
  });

  it('returns null when the game is over', () => {
    const locked: GameState = { ...newGame(1), grid: [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2], over: true };
    expect(chooseMove(locked, 'hard')).toBeNull();
  });

  it('is deterministic: same state and tier give the same move', () => {
    const state = newGame(99);
    for (const tier of AI_TIERS) expect(chooseMove(state, tier)).toBe(chooseMove(state, tier));
  });

  it('merges two 1024s into a 2048 when it can', () => {
    // Left and right both build 2048 here; up or down would waste the chance.
    const grid = [1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2];
    const state: GameState = { ...newGame(3), grid };
    expect(['left', 'right']).toContain(chooseMove(state, 'hard'));
  });

  it('evaluates a tidy board above a scattered one with the same tiles', () => {
    const tidy = [64, 32, 16, 8, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 0];
    const scattered = [2, 0, 64, 0, 0, 16, 0, 4, 32, 0, 0, 8, 0, 0, 0, 0];
    expect(evaluate(tidy)).toBeGreaterThan(evaluate(scattered));
  });

  it('legalMoves lists only directions that change the board', () => {
    const grid = [2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(legalMoves(grid)).toEqual(['down']);
  });

  it('paces get faster as difficulty rises', () => {
    expect(AI_CONFIG.hard.paceMs).toBeLessThan(AI_CONFIG.medium.paceMs);
    expect(AI_CONFIG.medium.paceMs).toBeLessThan(AI_CONFIG.easy.paceMs);
  });

  it('tiers are ordered: hard > medium > easy by average score over 6 games', () => {
    const avg = (tier: 'easy' | 'medium' | 'hard') =>
      [1, 2, 3, 4, 5, 6].reduce((sum, seed) => sum + play(seed, tier, 4000).score, 0) / 6;
    const easy = avg('easy');
    const medium = avg('medium');
    const hard = avg('hard');
    expect(medium).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(medium);
  }, 60_000);

  it('hard reaches at least 512 on a fixed seed', () => {
    expect(maxTile(play(1, 'hard', 4000).grid)).toBeGreaterThanOrEqual(512);
  }, 30_000);
});
