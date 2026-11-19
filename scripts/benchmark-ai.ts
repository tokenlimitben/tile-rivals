/**
 * Plays the computer opponent against itself and reports how far each tier gets.
 *
 *   npm run benchmark:ai            # 50 games per tier
 *   npm run benchmark:ai -- 20      # custom game count
 *
 * Games use fixed seeds (1..N) so results are reproducible run to run.
 */
import { AI_TIERS, chooseMove } from '../shared/ai';
import { maxTile, move, newGame } from '../shared/engine';

const games = Number(process.argv[2] ?? 50);
const MOVE_CAP = 20000;

const REACH = [512, 1024, 2048, 4096];

console.log(`| Tier | Games | ${REACH.map((r) => `Reached ${r}`).join(' | ')} | Median score | Avg ms/move |`);
console.log(`|---|---|${REACH.map(() => '---').join('|')}|---|---|`);

for (const tier of AI_TIERS) {
  const scores: number[] = [];
  const reached = REACH.map(() => 0);
  let totalMs = 0;
  let totalMoves = 0;

  for (let seed = 1; seed <= games; seed++) {
    let state = newGame(seed);
    for (let i = 0; i < MOVE_CAP && !state.over; i++) {
      const t0 = performance.now();
      const dir = chooseMove(state, tier);
      totalMs += performance.now() - t0;
      totalMoves++;
      if (!dir) break;
      state = move(state, dir).state;
    }
    scores.push(state.score);
    const top = maxTile(state.grid);
    REACH.forEach((r, i) => {
      if (top >= r) reached[i]!++;
    });
  }

  scores.sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)]!;
  const pct = reached.map((n) => `${Math.round((n / games) * 100)}%`);
  console.log(`| ${tier} | ${games} | ${pct.join(' | ')} | ${median} | ${(totalMs / totalMoves).toFixed(2)} |`);
}
