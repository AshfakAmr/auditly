import { notFound } from "next/navigation";
import { finalReportSchema } from "@/lib/ai/schemas";

import {
  ReportPageShell,
  type ReportPageViewModel,
} from "@/components/report/report-page-shell";
import { prisma } from "@/lib/db/prisma";

type ReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildPendingReportViewModel(report: {
  id: string;
  profileHandle: string;
  profileUrl: string;
  platform: "X" | "LINKEDIN";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  providerUsed: string | null;
  postsAnalyzedCount: number;
  createdAt: Date;
  lead: {
    email: string;
  };
}): ReportPageViewModel {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    id: report.id,
    profileHandle: report.profileHandle,
    profileUrl: report.profileUrl,
    platform: report.platform,
    status: report.status,
    email: report.lead.email,
    generatedAt: formatDate(report.createdAt),
    reportUrl: `${appUrl}/report/${report.id}`,
    overallScore: 0,
    postsAnalyzedCount: report.postsAnalyzedCount,
    dateRangeLabel: "Waiting for post data",
    providerUsed: report.providerUsed ?? "Not fetched yet",
    topPattern: "Pending analysis",
    weakestPattern: "Pending analysis",
    sections: [
      {
        key: "posting_consistency",
        title: "Posting consistency",
        score: 0,
        reason:
          "Waiting for the audit agent to fetch posts and calculate posting frequency.",
        evidence: [
          "No posts have been analyzed yet.",
          "The report record is already saved in the database.",
        ],
        recommendations: [
          "The final recommendation will be generated after real post data is fetched.",
        ],
      },
      {
        key: "content_mix",
        title: "Content mix",
        score: 0,
        reason:
          "Waiting for normalized post data to calculate content format and intent distribution.",
        evidence: [
          "Content type percentages are not available yet.",
          "AI classification will identify content intent later.",
        ],
        recommendations: [
          "The final content mix recommendation will be generated from real posts.",
        ],
      },
      {
        key: "hook_quality",
        title: "Hook quality",
        score: 0,
        reason:
          "Waiting for Gemini to classify the strength of first lines and opening hooks.",
        evidence: [
          "Hook analysis requires actual post text.",
          "The AI step is intentionally separated from deterministic metrics.",
        ],
        recommendations: [
          "The final hook recommendation will use examples from actual posts.",
        ],
      },
      {
        key: "topic_focus",
        title: "Topic focus",
        score: 0,
        reason:
          "Waiting for AI-assisted topic classification across the recent post set.",
        evidence: [
          "Topic clusters are not available yet.",
          "The audit agent will compare repeated themes and unrelated drift.",
        ],
        recommendations: [
          "The final topic recommendation will be generated after classification.",
        ],
      },
      {
        key: "engagement_patterns",
        title: "Engagement patterns",
        score: 0,
        reason:
          "Waiting for engagement metrics such as likes, comments, reposts, and views.",
        evidence: [
          "Best and weakest posts are not available yet.",
          "Timing and format patterns will be calculated after fetching posts.",
        ],
        recommendations: [
          "The final engagement recommendation will be based on real performance patterns.",
        ],
      },
    ],
    recommendations: [
      {
        title: "Fetch real public posts",
        description:
          "The next step is connecting the social provider layer so this report can analyze real recent posts instead of showing the pending state.",
      },
      {
        title: "Run deterministic metrics",
        description:
          "Posting frequency, gaps, content mix, and engagement totals should be calculated in TypeScript before AI synthesis.",
      },
      {
        title: "Generate AI strategy",
        description:
          "Gemini will classify hooks, topics, and content intent, then synthesize a final scored report.",
      },
    ],
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: {
      id,
    },
    include: {
      lead: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }
const parsedFinalReport = finalReportSchema.safeParse(report.finalReport);

if (parsedFinalReport.success) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const viewModel: ReportPageViewModel = {
    id: report.id,
    profileHandle: report.profileHandle,
    profileUrl: report.profileUrl,
    platform: report.platform,
    status: report.status,
    email: report.lead.email,
    generatedAt: formatDate(report.createdAt),
    reportUrl: `${appUrl}/report/${report.id}`,
    overallScore: Math.round(parsedFinalReport.data.overallScore),
    postsAnalyzedCount: report.postsAnalyzedCount,
    dateRangeLabel: "Recent public posts",
    providerUsed: report.providerUsed ?? "Unknown provider",
    topPattern: parsedFinalReport.data.topPattern,
    weakestPattern: parsedFinalReport.data.weakestPattern,
    sections: parsedFinalReport.data.sections.map((section) => ({
      ...section,
      score: Math.round(section.score),
    })),
    recommendations: parsedFinalReport.data.recommendations,
  };

  return <ReportPageShell report={viewModel} />;
}
}