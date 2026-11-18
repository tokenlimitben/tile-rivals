import { Board } from './Board';
import { useDirectionInput } from './useDirectionInput';
import { useSettings } from './useSettings';
import { useSoloGame } from './useSoloGame';

export function App() {
  const { game, tiles, event, best, shake, onMove, onNewGame, showWin, onKeepGoing } = useSoloGame();
  const { sound, reduceMotion, toggleSound, toggleReduceMotion } = useSettings();
  const inputEnabled = !game.over && !showWin;
  const inputHandlers = useDirectionInput(onMove, inputEnabled);

  return (
    <main className="shell">
      <header className="header">
        <h1 className="title">TILE RIVALS</h1>
        <div className="scores" aria-live="polite">
          <div className="score-box">
            <span className="score-label">SCORE</span>
            <span className="score-value">{game.score}</span>
            {event.kind === 'move' && event.gained > 0 && (
              <span key={event.n} className="gain" aria-hidden="true">
                +{event.gained}
              </span>
            )}
          </div>
          <div className="score-box">
            <span className="score-label">BEST</span>
            <span className="score-value">{best}</span>
          </div>
        </div>
      </header>

      <div className="toolbar">
        <p className="hint">Arrow keys, WASD or swipe. Merge tiles to reach 2048.</p>
        <button type="button" className="btn" onClick={onNewGame}>
          NEW GAME
        </button>
      </div>

      <Board tiles={tiles} shake={shake} reduceMotion={reduceMotion} inputHandlers={inputHandlers}>
        {game.over && (
          <div className="overlay" role="alertdialog" aria-label="Game over">
            <p className="overlay-title">GAME OVER</p>
            <p className="overlay-sub">Final score {game.score}</p>
            <button type="button" className="btn" onClick={onNewGame} autoFocus>
              TRY AGAIN
            </button>
          </div>
        )}
        {showWin && !game.over && (
          <div className="overlay overlay-win" role="alertdialog" aria-label="You reached 2048">
            <p className="overlay-title">YOU MADE 2048!</p>
            <p className="overlay-sub">Score {game.score}</p>
            <div className="overlay-actions">
              <button type="button" className="btn" onClick={onKeepGoing} autoFocus>
                KEEP GOING
              </button>
              <button type="button" className="btn btn-alt" onClick={onNewGame}>
                NEW GAME
              </button>
            </div>
          </div>
        )}
      </Board>

      <footer className="footer">
        <span>Moves: {game.moves}</span>
        <button type="button" className="chip" aria-pressed={sound} onClick={toggleSound}>
          SOUND: {sound ? 'ON' : 'OFF'}
        </button>
        <button type="button" className="chip" aria-pressed={reduceMotion} onClick={toggleReduceMotion}>
          MOTION: {reduceMotion ? 'REDUCED' : 'FULL'}
        </button>
      </footer>
    </main>
  );
}
