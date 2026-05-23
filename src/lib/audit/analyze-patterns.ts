import type {
  ContentMixMetrics,
  EngagementMetrics,
  EngagementPatternMetrics,
  PostingConsistencyMetrics,
} from "@/lib/audit/types";

export function analyzeEngagementPatterns(input: {
  consistency: PostingConsistencyMetrics;
  contentMix: ContentMixMetrics;
  engagement: EngagementMetrics;
}): EngagementPatternMetrics {
  const { consistency, contentMix, engagement } = input;

  const topPattern =
    engagement.bestPost?.firstLine ??
    `${contentMix.dominantType} posts are the dominant format`;

  const weakestPattern =
    consistency.longestGapDays > 4
      ? `Long inactive gap of ${consistency.longestGapDays} days`
      : engagement.weakestPost?.firstLine ?? "Weakest post pattern unavailable";

  const score = Math.round(
    (consistency.score + contentMix.score + engagement.score) / 3,
  );

  return {
    score,
    topPattern,
    weakestPattern,
    reason:
      "Engagement patterns are estimated using deterministic signals from post timing, content format, and engagement totals.",
    evidence: [
      `Top pattern: ${topPattern}`,
      `Weakest pattern: ${weakestPattern}`,
      `Dominant format: ${contentMix.dominantType}`,
    ],
    recommendations: [
      "Repeat the structure of the highest-performing post in future content.",
      "Avoid repeating the format or timing of the weakest-performing post.",
    ],
  };
}
