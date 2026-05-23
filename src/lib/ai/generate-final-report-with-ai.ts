import "server-only";

import {
  finalReportSchema,
  type AiClassifications,
  type FinalReport,
} from "@/lib/ai/schemas";
import { generateGeminiJson } from "@/lib/ai/gemini-client";
import { finalReportResponseSchema } from "@/lib/ai/response-schemas";
import type { DeterministicAuditMetrics } from "@/lib/audit/types";
import type { NormalizedPost } from "@/lib/social/types";

export async function generateFinalReportWithAI(input: {
  posts: NormalizedPost[];
  metrics: DeterministicAuditMetrics;
  classifications: AiClassifications;
}) {
  const prompt = `
You are an AI content strategist creating a scored social media content audit.

Create the final Auditly report using:
1. Deterministic metrics calculated by code.
2. AI classifications for hook quality and topic focus.
3. Actual post evidence.

Required sections exactly:
- posting_consistency
- content_mix
- hook_quality
- topic_focus
- engagement_patterns

Rules:
- Do not make generic recommendations.
- Every section must include specific evidence.
- Scores must be 0 to 100.
- Keep recommendations practical and specific.
- The final report must be meaningfully based on the supplied profile data.
- Return valid JSON only.

DETERMINISTIC METRICS:
${JSON.stringify(input.metrics, null, 2)}

AI CLASSIFICATIONS:
${JSON.stringify(input.classifications, null, 2)}

POSTS:
${JSON.stringify(
  input.posts.map((post) => ({
    id: post.id,
    firstLine: post.firstLine,
    postedAt: post.postedAt,
    mediaType: post.mediaType,
    engagement: post.engagement,
    url: post.url,
  })),
  null,
  2,
)}
`;

  const result = await generateGeminiJson<FinalReport>({
    prompt,
    responseSchema: finalReportResponseSchema,
  });

  return finalReportSchema.parse(result);
}