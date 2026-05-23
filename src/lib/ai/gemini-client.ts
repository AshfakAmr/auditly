import "server-only";

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing.");
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateGeminiJson<T>(input: {
  prompt: string;
  responseSchema: Record<string, unknown>;
}) {
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: input.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: input.responseSchema,
      temperature: 0.3,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(text) as T;
}
