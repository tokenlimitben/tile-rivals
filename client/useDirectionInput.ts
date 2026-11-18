import { useEffect, useRef, type PointerEvent } from 'react';
import type { Direction } from '../shared/engine';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  w: 'up',
  d: 'right',
  s: 'down',
  a: 'left',
  W: 'up',
  D: 'right',
  S: 'down',
  A: 'left',
};

const SWIPE_THRESHOLD_PX = 24;

/**
 * Keyboard (arrows / WASD) and swipe input.
 * Moves fire on keydown, not keyup, for the lowest input latency.
 */
export function useDirectionInput(onDirection: (dir: Direction) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      e.preventDefault(); // stop arrow keys from scrolling the page
      onDirection(dir);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDirection, enabled]);

  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || !enabled) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) onDirection(dx > 0 ? 'right' : 'left');
      else onDirection(dy > 0 ? 'down' : 'up');
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
