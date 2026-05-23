import type { EngagementMetrics } from "@/lib/audit/types";
import type { NormalizedPost } from "@/lib/social/types";

function round(value: number) {
  return Number(value.toFixed(2));
}

function compactPost(post: NormalizedPost) {
  return {
    id: post.id,
    url: post.url,
    firstLine: post.firstLine,
    postedAt: post.postedAt,
    totalEngagement: post.engagement.totalEngagement,
  };
}

export function calculateEngagement(
  posts: NormalizedPost[],
): EngagementMetrics {
  if (posts.length === 0) {
    return {
      score: 0,
      totalEngagement: 0,
      averageEngagement: 0,
      reason: "No posts were available to calculate engagement.",
      evidence: ["No engagement data found."],
      recommendations: ["Fetch public posts with engagement metrics."],
    };
  }

  const sortedByEngagement = [...posts].sort(
    (a, b) => b.engagement.totalEngagement - a.engagement.totalEngagement,
  );

  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.engagement.totalEngagement,
    0,
  );

  const averageEngagement = totalEngagement / posts.length;
  const bestPost = sortedByEngagement[0];
  const weakestPost = sortedByEngagement[sortedByEngagement.length - 1];

  const engagementSpread =
    bestPost.engagement.totalEngagement -
    weakestPost.engagement.totalEngagement;

  let score = 55;

  if (averageEngagement >= 1000) score += 30;
  else if (averageEngagement >= 300) score += 22;
  else if (averageEngagement >= 100) score += 14;
  else if (averageEngagement >= 30) score += 8;

  if (engagementSpread > averageEngagement * 3) score -= 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    totalEngagement,
    averageEngagement: round(averageEngagement),
    bestPost: compactPost(bestPost),
    weakestPost: compactPost(weakestPost),
    reason: `The profile averaged ${round(
      averageEngagement,
    )} engagements per post across ${posts.length} posts.`,
    evidence: [
      `Total engagement across analyzed posts is ${totalEngagement}.`,
      `Best post received ${bestPost.engagement.totalEngagement} engagements.`,
      `Weakest post received ${weakestPost.engagement.totalEngagement} engagements.`,
    ],
    recommendations: [
      "Compare the strongest and weakest post openings to identify repeatable patterns.",
      "Turn high-engagement topics into follow-up posts or short series.",
    ],
  };
}
