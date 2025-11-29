import OpenAI from "openai";
import { loadEnv } from "../config/env.js";

const { openaiApiKey } = loadEnv();
const client = new OpenAI({ apiKey: openaiApiKey });

export async function embedTexts(texts) {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings");
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("embedTexts requires at least one text input");
  }

  // Generate embeddings; callers should batch inputs upstream if needed.
  try {
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts
    });

    return res.data.map(d => d.embedding);
  } catch (err) {
    const detail = err?.message || "Unknown error";
    throw new Error(`Failed to generate embeddings: ${detail}`, { cause: err });
  }
}
