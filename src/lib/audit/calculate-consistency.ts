import type { PostingConsistencyMetrics } from "@/lib/audit/types";
import type { NormalizedPost } from "@/lib/social/types";

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function daysBetween(a: Date, b: Date) {
  const diff = Math.abs(a.getTime() - b.getTime());
  return diff / (1000 * 60 * 60 * 24);
}

function scoreConsistency(postsPerWeek: number, longestGapDays: number) {
  let score = 50;

  if (postsPerWeek >= 5) score += 30;
  else if (postsPerWeek >= 3) score += 24;
  else if (postsPerWeek >= 2) score += 16;
  else if (postsPerWeek >= 1) score += 8;

  if (longestGapDays <= 2) score += 20;
  else if (longestGapDays <= 4) score += 12;
  else if (longestGapDays <= 7) score += 5;
  else score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculatePostingConsistency(
  posts: NormalizedPost[],
): PostingConsistencyMetrics {
  if (posts.length === 0) {
    return {
      score: 0,
      postCount: 0,
      dateRangeDays: 0,
      postsPerWeek: 0,
      averageGapDays: 0,
      longestGapDays: 0,
      reason: "No posts were available to calculate posting consistency.",
      evidence: ["No public posts were found."],
      recommendations: [
        "Connect a provider that can return recent public posts.",
      ],
    };
  }

  const dates = posts
    .map((post) => new Date(post.postedAt))
    .sort((a, b) => b.getTime() - a.getTime());

  const newest = dates[0];
  const oldest = dates[dates.length - 1];
  const dateRangeDays = Math.max(1, Math.ceil(daysBetween(newest, oldest)));

  const gaps = dates.slice(0, -1).map((date, index) => {
    return daysBetween(date, dates[index + 1]);
  });

  const averageGapDays =
    gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;

  const longestGapDays = gaps.length > 0 ? Math.max(...gaps) : 0;
  const postsPerWeek = posts.length / (dateRangeDays / 7);

  const score = scoreConsistency(postsPerWeek, longestGapDays);

  return {
    score,
    postCount: posts.length,
    dateRangeDays,
    postsPerWeek: round(postsPerWeek),
    averageGapDays: round(averageGapDays),
    longestGapDays: round(longestGapDays),
    reason: `The profile published ${
      posts.length
    } posts across ${dateRangeDays} days, averaging ${round(
      postsPerWeek,
    )} posts per week.`,
    evidence: [
      `${posts.length} posts were analyzed.`,
      `Average posting gap is ${round(averageGapDays)} days.`,
      `Longest inactive gap is ${round(longestGapDays)} days.`,
    ],
    recommendations: [
      longestGapDays > 4
        ? "Reduce inactive gaps by scheduling posts at least 3 times per week."
        : "Maintain the current posting rhythm and avoid long inactive gaps.",
      "Use a predictable weekly posting schedule so the audience sees consistent activity.",
    ],
  };
}
