export function ScoreBox({
  label,
  value,
  gain = 0,
  gainKey = 0,
}: {
  label: string;
  value: number;
  /** Points just earned; shown as a floating "+N". Change `gainKey` to replay it. */
  gain?: number;
  gainKey?: number;
}) {
  return (
    <div className="score-box">
      <span className="score-label">{label}</span>
      <span className="score-value">{value}</span>
      {gain > 0 && (
        <span key={gainKey} className="gain" aria-hidden="true">
          +{gain}
        </span>
      )}
    </div>
  );
}
