import OpenAI from "openai";
import { loadEnv } from "../config/env.js";

const { openaiApiKey } = loadEnv();
const client = new OpenAI({ apiKey: openaiApiKey });

function assertApiKey() {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required for LLM operations");
  }
}

export const llmClient = {
  // Generate an assistant reply using provided context and prior conversation history.
  async generate({ system, history, user, context }) {
    assertApiKey();

    const messages = [
      { role: "system", content: system },
      { role: "system", content: `Relevant context:\n${context}` },
      ...history,
      { role: "user", content: user },
    ];

    try {
      const res = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
      });

      return res.choices[0].message.content;
    } catch (err) {
      const detail = err?.message || "Unknown error";
      throw new Error(`LLM generation failed: ${detail}`, { cause: err });
    }
  },
};

// Rewrite the user's query into a standalone, search-friendly form for retrieval.
export async function rewriteQuery(history, message) {
  assertApiKey();

  const messages = [
    {
      role: "system",
      content:
        "Rewrite the user's latest question into a standalone, search-optimized query. " +
        "Include important context from the conversation if needed. " +
        "Respond with only the rewritten query, no explanations.",
    },
    ...history.slice(-4),
    { role: "user", content: message },
  ];

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
    });

    return res.choices[0].message.content.trim();
  } catch (err) {
    const detail = err?.message || "Unknown error";
    throw new Error(`Query rewrite failed: ${detail}`, { cause: err });
  }
}
