import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, CELL_COUNT, WIN_TILE } from '../shared/constants';

describe('shared constants', () => {
  it('describes a 4x4 board', () => {
    expect(BOARD_SIZE).toBe(4);
    expect(CELL_COUNT).toBe(16);
  });

  it('uses 2048 as the winning tile', () => {
    expect(WIN_TILE).toBe(2048);
  });
});
