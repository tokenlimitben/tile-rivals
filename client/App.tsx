import { useState } from 'react';
import { SoloView } from './SoloView';
import { useSettings } from './useSettings';
import { VersusView } from './VersusView';

type Mode = 'solo' | 'versus';

export function App() {
  const [mode, setMode] = useState<Mode>('solo');
  const { sound, reduceMotion, toggleSound, toggleReduceMotion } = useSettings();

  return (
    <main className="shell">
      <h1 className="title">TILE RIVALS</h1>

      <nav className="tabs" aria-label="Game mode">
        <button type="button" className="tab" aria-pressed={mode === 'solo'} onClick={() => setMode('solo')}>
          SOLO
        </button>
        <button type="button" className="tab" aria-pressed={mode === 'versus'} onClick={() => setMode('versus')}>
          VS COMPUTER
        </button>
      </nav>

      {mode === 'solo' ? <SoloView reduceMotion={reduceMotion} /> : <VersusView reduceMotion={reduceMotion} />}

      <div className="footer settings">
        <button type="button" className="chip" aria-pressed={sound} onClick={toggleSound}>
          SOUND: {sound ? 'ON' : 'OFF'}
        </button>
        <button type="button" className="chip" aria-pressed={reduceMotion} onClick={toggleReduceMotion}>
          MOTION: {reduceMotion ? 'REDUCED' : 'FULL'}
        </button>
      </div>
    </main>
  );
}
