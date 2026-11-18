import { Board } from './Board';
import { useDirectionInput } from './useDirectionInput';
import { useSoloGame } from './useSoloGame';

export function App() {
  const { state, best, onMove, onNewGame, showWin, onKeepGoing } = useSoloGame();
  const inputEnabled = !state.over && !showWin;
  const inputHandlers = useDirectionInput(onMove, inputEnabled);

  return (
    <main className="shell">
      <header className="header">
        <h1 className="title">VERSUS 2048</h1>
        <div className="scores" aria-live="polite">
          <div className="score-box">
            <span className="score-label">SCORE</span>
            <span className="score-value">{state.score}</span>
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

      <Board grid={state.grid} lastSpawn={state.lastSpawn} inputHandlers={inputHandlers}>
        {state.over && (
          <div className="overlay" role="alertdialog" aria-label="Game over">
            <p className="overlay-title">GAME OVER</p>
            <p className="overlay-sub">Final score {state.score}</p>
            <button type="button" className="btn" onClick={onNewGame} autoFocus>
              TRY AGAIN
            </button>
          </div>
        )}
        {showWin && !state.over && (
          <div className="overlay overlay-win" role="alertdialog" aria-label="You reached 2048">
            <p className="overlay-title">YOU MADE 2048!</p>
            <p className="overlay-sub">Score {state.score}</p>
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

      <footer className="footer">Moves: {state.moves}</footer>
    </main>
  );
}
