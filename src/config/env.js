import dotenv from "dotenv";

// Load .env immediately so downstream imports see environment variables.
dotenv.config();

export function loadEnv() {
  const port = process.env.PORT || 3000;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!openaiApiKey) {
    console.warn("[WARN] OPENAI_API_KEY not set – embeddings/LLM will fail.");
  }

  if (!databaseUrl) {
    console.warn("[WARN] DATABASE_URL not set – Prisma may fail.");
  }

  return { port, openaiApiKey, databaseUrl };
}
