import { ScoreRing } from "@/components/report/score-ring";

type ScoreCardProps = {
  title: string;
  score: number;
  reason: string;
  evidence: string[];
  recommendations: string[];
  wide?: boolean;
};

export function ScoreCard({
  title,
  score,
  reason,
  evidence,
  recommendations,
  wide,
}: ScoreCardProps) {
  return (
    <article
      className={[
        "rounded-xl border border-[#55544d] bg-[#30302d] p-5",
        wide ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#d8d2c3]">{reason}</p>
        </div>

        <ScoreRing score={score} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#aaa396]">
            Evidence
          </p>
          <ul className="space-y-2">
            {evidence.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[#4d4c46] bg-[#2b2b28] px-3 py-2 text-[12px] leading-5 text-[#cfc8b8]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#aaa396]">
            Recommendation
          </p>
          <ul className="space-y-2">
            {recommendations.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[#4d4c46] bg-[#2b2b28] px-3 py-2 text-[12px] leading-5 text-[#cfc8b8]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
