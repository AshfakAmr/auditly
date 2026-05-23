import type { MediaType, NormalizedPost } from "@/lib/social/types";

export type ScoreMetric = {
  score: number;
  reason: string;
  evidence: string[];
  recommendations: string[];
};

export type PostingConsistencyMetrics = ScoreMetric & {
  postCount: number;
  dateRangeDays: number;
  postsPerWeek: number;
  averageGapDays: number;
  longestGapDays: number;
};

export type ContentMixMetrics = ScoreMetric & {
  distribution: Record<MediaType, number>;
  percentages: Record<MediaType, number>;
  dominantType: MediaType;
};

export type EngagementMetrics = ScoreMetric & {
  totalEngagement: number;
  averageEngagement: number;
  bestPost?: Pick<NormalizedPost, "id" | "url" | "firstLine" | "postedAt"> & {
    totalEngagement: number;
  };
  weakestPost?: Pick<
    NormalizedPost,
    "id" | "url" | "firstLine" | "postedAt"
  > & {
    totalEngagement: number;
  };
};

export type EngagementPatternMetrics = ScoreMetric & {
  topPattern: string;
  weakestPattern: string;
};

export type DeterministicAuditMetrics = {
  generatedAt: string;
  postCount: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    label: string;
  };
  overallPreviewScore: number;
  postingConsistency: PostingConsistencyMetrics;
  contentMix: ContentMixMetrics;
  engagement: EngagementMetrics;
  engagementPatterns: EngagementPatternMetrics;
};
