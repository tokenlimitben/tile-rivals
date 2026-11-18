import { describe, expect, it } from 'vitest';
import { mergeFrequency } from '../client/audio';

describe('mergeFrequency', () => {
  it('rises with tile value', () => {
    const values = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    const freqs = values.map(mergeFrequency);
    for (let i = 1; i < freqs.length; i++) expect(freqs[i]!).toBeGreaterThan(freqs[i - 1]!);
  });

  it('starts at middle C for a 4 tile', () => {
    expect(mergeFrequency(4)).toBeCloseTo(261.63, 1);
  });

  it('stays in an audible, non-piercing range', () => {
    for (const v of [4, 2048, 16384, 131072]) {
      const f = mergeFrequency(v);
      expect(f).toBeGreaterThan(200);
      expect(f).toBeLessThanOrEqual(2093);
    }
  });
});
