import { BOARD_SIZE } from '../shared/constants';

export function App() {
  return (
    <main className="shell">
      <h1 className="title">VERSUS 2048</h1>
      <p className="subtitle">
        {BOARD_SIZE}x{BOARD_SIZE} board · retro pixel edition
      </p>
      <p className="status">Scaffold ready. The game arrives in milestone M1.</p>
    </main>
  );
}
