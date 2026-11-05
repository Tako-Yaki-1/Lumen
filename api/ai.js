// Vercel runs this file as the /api/ai route.
// It reuses the same AI code as the local dev server and reads
// OPENROUTER_API_KEY from the Environment Variables set on Vercel.
import { handleAI } from "../server/ai.js";

// Free models can be slow, so allow up to 60 seconds per request.
export const config = { maxDuration: 60 };

export default function handler(req, res) {
  return handleAI(req, res, process.env);
}
