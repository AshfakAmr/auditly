import type { DeterministicAuditMetrics } from "@/lib/audit/types";
import { analyzeEngagementPatterns } from "@/lib/audit/analyze-patterns";
import { calculateContentMix } from "@/lib/audit/calculate-content-mix";
import { calculateEngagement } from "@/lib/audit/calculate-engagement";
import { calculatePostingConsistency } from "@/lib/audit/calculate-consistency";
import { normalizePosts } from "@/lib/audit/normalize-posts";
import type { RawPost } from "@/lib/social/types";

function getDateRange(rawDates: string[]) {
  if (rawDates.length === 0) {
    return {
      startDate: null,
      endDate: null,
      label: "No posts analyzed",
    };
  }

  const dates = rawDates
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: `${formatter.format(startDate)} - ${formatter.format(endDate)}`,
  };
}

export function buildDeterministicAudit(rawPosts: RawPost[]) {
  const normalizedPosts = normalizePosts(rawPosts);

  const postingConsistency = calculatePostingConsistency(normalizedPosts);
  const contentMix = calculateContentMix(normalizedPosts);
  const engagement = calculateEngagement(normalizedPosts);
  const engagementPatterns = analyzeEngagementPatterns({
    consistency: postingConsistency,
    contentMix,
    engagement,
  });

  const overallPreviewScore = Math.round(
    (postingConsistency.score +
      contentMix.score +
      engagement.score +
      engagementPatterns.score) /
      4,
  );

  const metrics: DeterministicAuditMetrics = {
    generatedAt: new Date().toISOString(),
    postCount: normalizedPosts.length,
    dateRange: getDateRange(normalizedPosts.map((post) => post.postedAt)),
    overallPreviewScore,
    postingConsistency,
    contentMix,
    engagement,
    engagementPatterns,
  };

  return {
    normalizedPosts,
    metrics,
  };
}
