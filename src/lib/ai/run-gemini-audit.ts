import "server-only";

import { classifyPostsWithAI } from "@/lib/ai/classify-posts-with-ai";
import { generateFinalReportWithAI } from "@/lib/ai/generate-final-report-with-ai";
import type { DeterministicAuditMetrics } from "@/lib/audit/types";
import type { NormalizedPost } from "@/lib/social/types";

export async function runGeminiAudit(input: {
  normalizedPosts: NormalizedPost[];
  metrics: DeterministicAuditMetrics;
}) {
  const classifications = await classifyPostsWithAI(input.normalizedPosts);

  const finalReport = await generateFinalReportWithAI({
    posts: input.normalizedPosts,
    metrics: input.metrics,
    classifications,
  });

  return {
    classifications,
    finalReport,
  };
}
