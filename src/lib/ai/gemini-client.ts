import "server-only";

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

export const GEMINI_MODEL = "gemini-2.5-flash-lite";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
