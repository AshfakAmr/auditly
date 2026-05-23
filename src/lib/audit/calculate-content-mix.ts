import type { ContentMixMetrics } from "@/lib/audit/types";
import type { MediaType, NormalizedPost } from "@/lib/social/types";

const mediaTypes: MediaType[] = [
  "text",
  "image",
  "video",
  "link",
  "poll",
  "carousel",
  "unknown",
];

function emptyDistribution() {
  return Object.fromEntries(mediaTypes.map((type) => [type, 0])) as Record<
    MediaType,
    number
  >;
}

function round(value: number) {
  return Math.round(value);
}

export function calculateContentMix(
  posts: NormalizedPost[],
): ContentMixMetrics {
  const distribution = emptyDistribution();

  for (const post of posts) {
    distribution[post.mediaType] += 1;
  }

  const percentages = emptyDistribution();

  for (const type of mediaTypes) {
    percentages[type] = posts.length
      ? round((distribution[type] / posts.length) * 100)
      : 0;
  }

  const dominantType = mediaTypes.reduce((currentBest, type) => {
    return distribution[type] > distribution[currentBest] ? type : currentBest;
  }, "text" as MediaType);

  const usedTypes = mediaTypes.filter((type) => distribution[type] > 0).length;

  let score = 45 + usedTypes * 10;

  if (percentages[dominantType] > 80) score -= 15;
  if (usedTypes >= 3) score += 10;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    distribution,
    percentages,
    dominantType,
    reason: `The content mix is mostly ${dominantType}, with ${usedTypes} content format type(s) detected.`,
    evidence: [
      `${percentages[dominantType]}% of analyzed posts are ${dominantType} posts.`,
      `${usedTypes} different content format type(s) were found.`,
      `Distribution: ${
        mediaTypes
          .filter((type) => distribution[type] > 0)
          .map((type) => `${type} ${percentages[type]}%`)
          .join(", ") || "no distribution available"
      }.`,
    ],
    recommendations: [
      usedTypes < 3
        ? "Add more variety by mixing text posts with image, video, link, or thread-style content."
        : "Keep the current variety, but review which format gets the highest engagement.",
      "Avoid relying too heavily on one format unless it clearly outperforms the others.",
    ],
  };
}
