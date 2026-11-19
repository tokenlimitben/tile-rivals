import { useState } from 'react';
import { AI_TIERS, type AiTier } from '../shared/ai';
import { FIRST_TO_2048_CAP_SECONDS, TIMED_MATCH_SECONDS, type MatchFormat } from '../shared/constants';
import { Board } from './Board';
import { ScoreBox } from './ScoreBox';
import { randomSeed } from './useBoardState';
import { useDirectionInput } from './useDirectionInput';
import { useVersusMatch } from './useVersusMatch';

const TIER_LABEL: Record<AiTier, string> = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
const FORMATS: { id: MatchFormat; label: string; blurb: string }[] = [
  { id: 'timed', label: 'TIMED RACE', blurb: `${TIMED_MATCH_SECONDS / 60} minutes, highest score wins` },
  {
    id: 'first-to-2048',
    label: 'FIRST TO 2048',
    blurb: `build 2048 first (${FIRST_TO_2048_CAP_SECONDS / 60} minute cap)`,
  },
];

interface MatchConfig {
  tier: AiTier;
  format: MatchFormat;
  seed: number;
}

export function VersusView({ reduceMotion }: { reduceMotion: boolean }) {
  const [tier, setTier] = useState<AiTier>('medium');
  const [format, setFormat] = useState<MatchFormat>('timed');
  const [match, setMatch] = useState<MatchConfig | null>(null);

  if (match) {
    return (
      <Match
        key={match.seed}
        config={match}
        reduceMotion={reduceMotion}
        onRematch={() => setMatch({ ...match, seed: randomSeed() })}
        onExit={() => setMatch(null)}
      />
    );
  }

  return (
    <section className="setup" aria-label="Match setup">
      <p className="hint">You and the computer get the same tiles in the same order, so the better player wins.</p>

      <fieldset className="choice-group">
        <legend>DIFFICULTY</legend>
        <div className="choices">
          {AI_TIERS.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={tier === t} onClick={() => setTier(t)}>
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-group">
        <legend>FORMAT</legend>
        <div className="choices">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip chip-wide"
              aria-pressed={format === f.id}
              onClick={() => setFormat(f.id)}
            >
              <span>{f.label}</span>
              <small>{f.blurb}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <button type="button" className="btn btn-start" onClick={() => setMatch({ tier, format, seed: randomSeed() })}>
        START MATCH
      </button>
    </section>
  );
}

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function Match({
  config,
  reduceMotion,
  onRematch,
  onExit,
}: {
  config: MatchConfig;
  reduceMotion: boolean;
  onRematch: () => void;
  onExit: () => void;
}) {
  const { player, rival, phase, count, outcome, remainingMs, canMove, onMove } = useVersusMatch(
    config.seed,
    config.tier,
    config.format,
  );
  const inputHandlers = useDirectionInput(onMove, canMove);

  const result =
    outcome === null ? null : outcome.winner === 'a' ? 'YOU WIN!' : outcome.winner === 'b' ? 'COMPUTER WINS' : 'DRAW';
  const why =
    outcome?.reason === 'reached-2048'
      ? outcome.winner === 'a'
        ? 'You built 2048 first.'
        : 'The computer built 2048 first.'
      : outcome?.reason === 'boards-locked'
        ? 'Both boards are locked.'
        : "Time's up. Highest score wins.";

  return (
    <>
      <div className="match-bar" role="timer" aria-live="off">
        <span className="match-tag">
          {TIER_LABEL[config.tier]} · {config.format === 'timed' ? 'TIMED' : 'FIRST TO 2048'}
        </span>
        <span className="match-clock">{phase === 'countdown' ? 'READY' : clock(remainingMs)}</span>
      </div>

      <div className="versus-boards">
        <div className="side">
          <div className="side-head">
            <span className="side-name">YOU</span>
            <ScoreBox label="SCORE" value={player.game.score} gain={player.event.kind === 'move' ? player.event.gained : 0} gainKey={player.event.n} />
          </div>
          <Board tiles={player.tiles} shake={player.shake} reduceMotion={reduceMotion} inputHandlers={inputHandlers}>
            {phase === 'countdown' && (
              <div className="overlay overlay-light" aria-live="assertive">
                <p className="overlay-count">{count}</p>
              </div>
            )}
            {phase === 'playing' && player.game.over && (
              <div className="overlay overlay-light">
                <p className="overlay-title">LOCKED</p>
                <p className="overlay-sub">Waiting for the clock…</p>
              </div>
            )}
            {phase === 'finished' && (
              <div className="overlay" role="alertdialog" aria-label="Match result">
                <p className="overlay-title">{result}</p>
                <p className="overlay-sub">{why}</p>
                <p className="overlay-sub">
                  {player.game.score} vs {rival.game.score}
                </p>
                <div className="overlay-actions">
                  <button type="button" className="btn" onClick={onRematch} autoFocus>
                    REMATCH
                  </button>
                  <button type="button" className="btn btn-alt" onClick={onExit}>
                    MENU
                  </button>
                </div>
              </div>
            )}
          </Board>
        </div>

        <div className="side side-rival">
          <div className="side-head">
            <span className="side-name">COMPUTER</span>
            <ScoreBox label="SCORE" value={rival.game.score} />
          </div>
          <Board tiles={rival.tiles} shake={0} reduceMotion={reduceMotion}>
            {rival.game.over && (
              <div className="overlay overlay-light">
                <p className="overlay-title">LOCKED</p>
              </div>
            )}
          </Board>
        </div>
      </div>

      <p className="hint">Arrow keys, WASD or swipe. The computer plays the same tiles you do.</p>
    </>
  );
}

