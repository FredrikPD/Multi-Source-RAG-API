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
