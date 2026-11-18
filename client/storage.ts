/** localStorage wrapper that never throws (private windows and blocked storage are common). */

export function readNumber(key: string, fallback = 0): number {
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function writeNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable: the game still works, the best score just won't persist */
  }
}
