import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  LinkIcon,
  MessageSquareText,
  PenLine,
  Target,
} from "lucide-react";

import { CopyReportLinkButton } from "@/components/report/copy-report-link-button";
import { RecommendationCard } from "@/components/report/recommendation-card";
import { ScoreCard } from "@/components/report/score-card";

type ReportStatus = "PROCESSING" | "COMPLETED" | "FAILED";
type Platform = "X" | "LINKEDIN";

type ScoreSection = {
  key: string;
  title: string;
  score: number;
  reason: string;
  evidence: string[];
  recommendations: string[];
};

type Recommendation = {
  title: string;
  description: string;
};

export type ReportPageViewModel = {
  id: string;
  profileHandle: string;
  profileUrl: string;
  platform: Platform;
  status: ReportStatus;
  email: string;
  generatedAt: string;
  reportUrl: string;
  overallScore: number;
  postsAnalyzedCount: number;
  dateRangeLabel: string;
  providerUsed: string;
  topPattern: string;
  weakestPattern: string;
  sections: ScoreSection[];
  recommendations: Recommendation[];
};

const recommendationIcons = [PenLine, Clock3, MessageSquareText];

export function ReportPageShell({ report }: { report: ReportPageViewModel }) {
  const initials = report.profileHandle.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-dvh bg-[#1f1f1d] p-4 text-[#f4f2ea] md:p-5">
      <section className="mx-auto min-h-[calc(100dvh-32px)] w-full rounded-xl border border-[#4a4a45] bg-[#2d2d2a] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.36)] md:min-h-[calc(100dvh-40px)] md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <header className="flex flex-col gap-6 border-b border-[#55544d] pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#eee8d8] text-[16px] font-semibold text-[#2d2d2a]">
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">
                    @{report.profileHandle}
                  </h1>

                  <span className="rounded-full border border-[#5c5b54] bg-[#30302d] px-3 py-1 text-xs font-semibold text-[#eee9dc]">
                    {report.platform === "X" ? "𝕏 Twitter / X" : "LinkedIn"}
                  </span>

                  <span className="rounded-full border border-[#5c5b54] bg-[#30302d] px-3 py-1 text-xs font-semibold text-[#eee9dc]">
                    {report.status}
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#cfc8b8]">
                  Analyzed {report.postsAnalyzedCount} posts ·{" "}
                  {report.dateRangeLabel} · Generated {report.generatedAt}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#bdb7aa]">
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="size-3.5" />
                    Top pattern: {report.topPattern}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Weakest pattern: {report.weakestPattern}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#55544d] bg-[#30302d] px-6 py-5 text-left lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#aaa396]">
                Overall score
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-[#1D9E75]">
                {report.overallScore}
              </p>
            </div>
          </header>

          {report.status === "PROCESSING" ? (
            <div className="mt-6 rounded-xl border border-[#70695f] bg-[#302f2c] p-5">
              <h2 className="text-lg font-semibold text-white">
                Report generation is queued
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#cfc8b8]">
                The report URL is already persistent and saved in the database.
                In the next branch, the audit agent will fetch real posts,
                calculate metrics, call Gemini, and replace this preview with
                actual scored analysis.
              </p>
            </div>
          ) : null}

          <section className="mt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#aaa396]">
              Analysis breakdown
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {report.sections.map((section) => (
                <ScoreCard
                  key={section.key}
                  title={section.title}
                  score={section.score}
                  reason={section.reason}
                  evidence={section.evidence}
                  recommendations={section.recommendations}
                  wide={section.key === "engagement_patterns"}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#aaa396]">
              Recommendations
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {report.recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.title}
                  icon={recommendationIcons[index] ?? PenLine}
                  title={recommendation.title}
                  description={recommendation.description}
                />
              ))}
            </div>
          </section>

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#55544d] pt-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[#bdb7aa]">
              <LinkIcon className="size-4 shrink-0" />
              <span className="truncate">{report.reportUrl}</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#70695f] px-4 text-sm font-semibold text-white hover:bg-[#3a3935]"
              >
                New audit
              </Link>

              <CopyReportLinkButton reportUrl={report.reportUrl} />
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
