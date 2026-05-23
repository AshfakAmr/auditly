type ScoreRingProps = {
  score: number;
};

function getScoreColor(score: number) {
  if (score >= 75) return "#1D9E75";
  if (score >= 60) return "#EF9F27";
  return "#E24B4A";
}

export function ScoreRing({ score }: ScoreRingProps) {
  const safeScore = Math.max(0, Math.min(100, score));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (safeScore / 100) * circumference;
  const color = getScoreColor(safeScore);

  return (
    <div className="relative size-12 shrink-0">
      <svg className="-rotate-90" width="48" height="48" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#55544d"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold"
        style={{ color }}
      >
        {safeScore}
      </div>
    </div>
  );
}
