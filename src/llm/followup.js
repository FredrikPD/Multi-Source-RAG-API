import OpenAI from "openai";
import { loadEnv } from "../config/env.js";

const { openaiApiKey } = loadEnv();
const client = new OpenAI({ apiKey: openaiApiKey });

function assertApiKey() {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required for follow-up rewriting");
  }
}

/**
 * Heuristic check: is this likely a follow-up like "What about X?".
 * Very cheap and easy to tweak.
 */
export function isFollowUpQuestion(message) {
  if (!message) return false;
  const text = message.trim().toLowerCase();

  if (text.length === 0) return false;

  // Short, vague questions are often follow-ups
  if (text.length < 25) return true;

  const starters = [
    "what about",
    "how about",
    "and ",
    "also ",
    "what if",
    "why that",
    "why is that",
    "what does that mean",
  ];

  if (starters.some((s) => text.startsWith(s))) return true;

  const pronouns = ["it", "that", "this", "those", "they"];
  const tokens = text.split(/\s+/);
  if (pronouns.some((p) => tokens.includes(p))) return true;

  return false;
}

/**
 * Use conversation history + latest user message to create
 * a standalone, search-friendly question (no placeholders).
 */
export async function buildStandaloneQuestion(historyMessages, userMessage) {
  assertApiKey();

  const recentHistory = historyMessages.slice(-6);

  const messages = [
    {
      role: "system",
      content:
        "You turn follow-up questions into standalone, fully-contextual questions.\n" +
        "Use the conversation history to resolve pronouns like 'it', 'that', 'this', etc.\n" +
        "Do NOT add new facts or make up details.\n" +
        "Do NOT use placeholders like [product] or brackets.\n" +
        "Output ONLY the rewritten standalone question.",
    },
    ...recentHistory,
    { role: "user", content: userMessage },
  ];

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    const detail = err?.message || "Unknown error";
    throw new Error(`Follow-up rewrite failed: ${detail}`, { cause: err });
  }
}
