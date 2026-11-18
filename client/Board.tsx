import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { BOARD_SIZE, CELL_COUNT } from '../shared/constants';
import type { TileModel } from './tiles';

interface BoardProps {
  tiles: readonly TileModel[];
  /** Non-zero value that changes each time the board should shake. */
  shake: number;
  reduceMotion: boolean;
  inputHandlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: () => void;
  };
  children?: ReactNode; // overlays (game over, win)
}

function tileClass(value: number): string {
  return value > 2048 ? 'tile-super' : `tile-${value}`;
}

const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: 'translate(0, 0)' },
  { transform: 'translate(-5px, 2px)' },
  { transform: 'translate(5px, -3px)' },
  { transform: 'translate(-3px, -2px)' },
  { transform: 'translate(2px, 2px)' },
  { transform: 'translate(0, 0)' },
];

/**
 * Empty cells form a static backdrop; tiles float above it and are positioned with a
 * CSS transform, so moving a tile is a transition the browser can run on the GPU.
 * Every tile shows its number, so colour is never the only signal (accessibility).
 */
export function Board({ tiles, shake, reduceMotion, inputHandlers, children }: BoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shake === 0 || reduceMotion) return;
    wrapRef.current?.animate(SHAKE_KEYFRAMES, { duration: 240, easing: 'ease-out' });
  }, [shake, reduceMotion]);

  return (
    <div className="board-wrap" ref={wrapRef} {...inputHandlers}>
      <div className="board" role="group" aria-label="Game board">
        {Array.from({ length: CELL_COUNT }, (_, i) => (
          <div key={i} className="cell" />
        ))}
      </div>

      <div className="tile-layer">
        {tiles.map((t) => {
          const row = Math.floor(t.index / BOARD_SIZE);
          const col = t.index % BOARD_SIZE;
          return (
            <div
              key={t.id}
              className={`tile-item${t.removing ? ' is-removing' : ''}`}
              style={{ '--x': col, '--y': row } as CSSProperties}
              role="img"
              aria-hidden={t.removing || undefined}
              aria-label={`${t.value}, row ${row + 1}, column ${col + 1}`}
            >
              <div
                className={`tile ${tileClass(t.value)}${t.isNew ? ' tile-new' : ''}${
                  t.isMerged ? ' tile-merged' : ''
                }${t.value >= 1000 ? ' tile-long' : ''}`}
              >
                {t.value}
              </div>
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}
