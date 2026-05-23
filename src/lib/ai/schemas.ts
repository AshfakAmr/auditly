import * as z from "zod";

export const auditSectionKeySchema = z.enum([
  "posting_consistency",
  "content_mix",
  "hook_quality",
  "topic_focus",
  "engagement_patterns",
]);

export const postClassificationSchema = z.object({
  id: z.string(),
  hookScore: z.number().min(0).max(100),
  hookReason: z.string(),
  topic: z.string(),
  contentIntent: z.string(),
  evidence: z.string(),
});

export const aiClassificationsSchema = z.object({
  posts: z.array(postClassificationSchema),
  hookQuality: z.object({
    score: z.number().min(0).max(100),
    reason: z.string(),
    evidence: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  topicFocus: z.object({
    score: z.number().min(0).max(100),
    reason: z.string(),
    evidence: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export const reportSectionSchema = z.object({
  key: auditSectionKeySchema,
  title: z.string(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  evidence: z.array(z.string()).min(1),
  recommendations: z.array(z.string()).min(1),
});

export const finalReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  topPattern: z.string(),
  weakestPattern: z.string(),
  sections: z.array(reportSectionSchema).length(5),
  recommendations: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(3)
    .max(5),
});

export type AiClassifications = z.infer<typeof aiClassificationsSchema>;
export type FinalReport = z.infer<typeof finalReportSchema>;
