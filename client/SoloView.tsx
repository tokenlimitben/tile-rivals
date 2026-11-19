import { Board } from './Board';
import { ScoreBox } from './ScoreBox';
import { useDirectionInput } from './useDirectionInput';
import { useSoloGame } from './useSoloGame';

export function SoloView({ reduceMotion }: { reduceMotion: boolean }) {
  const { game, tiles, event, best, shake, onMove, onNewGame, showWin, onKeepGoing } = useSoloGame();
  const inputHandlers = useDirectionInput(onMove, !game.over && !showWin);

  return (
    <>
      <div className="header">
        <p className="hint">Arrow keys, WASD or swipe. Merge tiles to reach 2048.</p>
        <div className="scores" aria-live="polite">
          <ScoreBox label="SCORE" value={game.score} gain={event.kind === 'move' ? event.gained : 0} gainKey={event.n} />
          <ScoreBox label="BEST" value={best} />
        </div>
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

      <div className="footer">
        <span>Moves: {game.moves}</span>
        <button type="button" className="btn" onClick={onNewGame}>
          NEW GAME
        </button>
      </div>
    </>
  );
}
