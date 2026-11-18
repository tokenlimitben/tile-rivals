import type { PointerEvent, ReactNode } from 'react';

interface BoardProps {
  grid: readonly number[];
  lastSpawn: number;
  inputHandlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: () => void;
  };
  children?: ReactNode; // overlays (game over, win)
}

function tileClass(value: number): string {
  if (value === 0) return 'tile-empty';
  return value > 2048 ? 'tile-super' : `tile-${value}`;
}

/** Every tile shows its number, so colour is never the only signal (accessibility). */
export function Board({ grid, lastSpawn, inputHandlers, children }: BoardProps) {
  return (
    <div className="board-wrap">
      <div className="board" role="grid" aria-label="Game board" {...inputHandlers}>
        {grid.map((value, i) => (
          <div
            key={i}
            role="gridcell"
            className={`tile ${tileClass(value)}${i === lastSpawn ? ' tile-new' : ''}${
              value >= 1000 ? ' tile-long' : ''
            }`}
          >
            {value === 0 ? '' : value}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
