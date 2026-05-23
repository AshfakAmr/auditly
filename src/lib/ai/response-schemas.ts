import { Type } from "@google/genai";

export const aiClassificationsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    posts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          hookScore: { type: Type.NUMBER },
          hookReason: { type: Type.STRING },
          topic: { type: Type.STRING },
          contentIntent: { type: Type.STRING },
          evidence: { type: Type.STRING },
        },
        required: [
          "id",
          "hookScore",
          "hookReason",
          "topic",
          "contentIntent",
          "evidence",
        ],
      },
    },
    hookQuality: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reason: { type: Type.STRING },
        evidence: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["score", "reason", "evidence", "recommendations"],
    },
    topicFocus: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        reason: { type: Type.STRING },
        evidence: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["score", "reason", "evidence", "recommendations"],
    },
  },
  required: ["posts", "hookQuality", "topicFocus"],
};

export const finalReportResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    topPattern: { type: Type.STRING },
    weakestPattern: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: {
            type: Type.STRING,
            enum: [
              "posting_consistency",
              "content_mix",
              "hook_quality",
              "topic_focus",
              "engagement_patterns",
            ],
          },
          title: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING },
          evidence: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "key",
          "title",
          "score",
          "reason",
          "evidence",
          "recommendations",
        ],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "description"],
      },
    },
  },
  required: [
    "overallScore",
    "summary",
    "topPattern",
    "weakestPattern",
    "sections",
    "recommendations",
  ],
};
