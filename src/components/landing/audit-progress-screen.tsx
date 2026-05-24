import { CheckCircle2, Loader2 } from "lucide-react";

type AuditProgressScreenProps = {
  activeStepIndex: number;
};

const steps = [
  "Fetching public posts",
  "Normalizing profile data",
  "Calculating posting consistency",
  "Analyzing content mix",
  "Scoring hook quality",
  "Detecting topic focus",
  "Generating scored report",
];

export function AuditProgressScreen({
  activeStepIndex,
}: AuditProgressScreenProps) {
  return (
    <main className="min-h-screen bg-[#1f1f1d] p-4 text-[#f4f2ea] md:p-5">
      <section className="mx-auto flex min-h-[calc(100dvh-32px)] w-full items-center justify-center md:min-h-[calc(100dvh-40px)]">
        <div className="w-full max-w-2xl rounded-xl border border-[#4a4a45] bg-[#2d2d2a] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)] md:p-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-[#5d5c55] bg-[#30302d]">
              <Loader2 className="size-7 animate-spin text-white" />
            </div>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em] text-[#c8c2b4]">
              Auditly
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
              Building your AI audit
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#cfc8b8]">
              We are fetching real public posts, calculating deterministic
              metrics, and generating a scored strategy report.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {steps.map((step, index) => {
              const isDone = index < activeStepIndex;
              const isActive = index === activeStepIndex;

              return (
                <div
                  key={step}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    isActive
                      ? "border-[#827a6c] bg-[#35342f]"
                      : "border-[#55544d] bg-[#30302d]",
                  ].join(" ")}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#626159] bg-[#2b2b28]">
                    {isDone ? (
                      <CheckCircle2 className="size-4 text-[#1D9E75]" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <span className="text-xs font-semibold text-[#aaa396]">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <span
                    className={[
                      "text-sm font-semibold",
                      isActive || isDone ? "text-white" : "text-[#aaa396]",
                    ].join(" ")}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[#aaa396]">
            This can take a few seconds because the app is fetching public post
            data and calling the AI model server-side.
          </p>
        </div>
      </section>
    </main>
  );
}
