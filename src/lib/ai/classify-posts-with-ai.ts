import "server-only";

import {
  aiClassificationsSchema,
  type AiClassifications,
} from "@/lib/ai/schemas";
import { generateGeminiJson } from "@/lib/ai/gemini-client";
import { aiClassificationsResponseSchema } from "@/lib/ai/response-schemas";
import type { NormalizedPost } from "@/lib/social/types";

export async function classifyPostsWithAI(posts: NormalizedPost[]) {
  const prompt = `
You are an expert social media content strategist.

Analyze these recent public X/Twitter posts.

For each post:
- Score hook quality from 0 to 100.
- Identify the main topic.
- Identify content intent, such as opinion, question, announcement, educational, personal, promotional, community engagement, or news/commentary.
- Give short evidence from the post text.

Then produce aggregate hookQuality and topicFocus scores.

Rules:
- Do not invent metrics.
- Use only the given posts.
- Keep evidence specific.
- Return valid JSON only.

POSTS:
${JSON.stringify(
  posts.map((post) => ({
    id: post.id,
    firstLine: post.firstLine,
    text: post.text,
    postedAt: post.postedAt,
    engagement: post.engagement,
  })),
  null,
  2,
)}
`;

  const result = await generateGeminiJson<AiClassifications>({
    prompt,
    responseSchema: aiClassificationsResponseSchema,
  });

  return aiClassificationsSchema.parse(result);
}