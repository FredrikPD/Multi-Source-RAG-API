// Chat service that stitches together retrieval, query rewriting, and persistence
// to answer user prompts with grounded context.
import { prisma } from "../db/client.js";
import { embedTexts } from "./embeddings.js";
import { vectorStore } from "./vectorStore.js";
import { llmClient } from "../llm/llmClient.js";
import { rewriteQuery } from "../llm/queryEnhancement.js";
import { isFollowUpQuestion, buildStandaloneQuestion } from "../llm/followup.js";
import { randomUUID } from "crypto";

export async function chatWithKnowledge({ sessionId, message }) {
  let session = null;
  const followUp = isFollowUpQuestion(message);

  // Try to hydrate the ongoing session to preserve conversation context.
  if (sessionId) {
    session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // For follow-ups without a session, fall back to the latest session with history.
  if (!session && followUp) {
    const lastSession = await prisma.session.findFirst({
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (lastSession && lastSession.messages.length > 0) {
      session = lastSession;
    }
  }

  if (!session) {
    session = await prisma.session.create({ data: { id: randomUUID() } });
    session.messages = [];
  }

  // Transform stored chat messages into the format the LLM expects.
  const historyMessages = session.messages?.map(m => ({ role: m.role, content: m.content })) || [];

  let effectiveUserQuestion = message;

  // If the message is a follow-up, attempt to rewrite it into a standalone question.
  if (followUp && historyMessages.length > 0) {
    try {
      const standalone = await buildStandaloneQuestion(
        historyMessages,
        message
      );
      if (standalone && standalone.length > 0) {
        console.log("Follow-up => standalone question:", standalone);
        effectiveUserQuestion = standalone;
      }
    } catch (err) {
      console.warn("Follow-up rewrite failed, using raw message:", err);
    }
  }

  let effectiveQuery = effectiveUserQuestion;

  // Enhance the user question to improve retrieval without changing the final answer.
  try {
    const rewritten = await rewriteQuery(historyMessages, message);
    if (rewritten && rewritten.length > 0) {
      effectiveQuery = rewritten;
      console.log("Enhanced query:", effectiveQuery);
    }
  } catch (err) {
    console.warn("Query rewrite failed, falling back to original message:", err);
  }

  const [queryEmbedding] = await embedTexts([effectiveQuery]);
  const retrieved = await vectorStore.search(queryEmbedding, 3);

  // Assemble retrieved text into a context block used to ground the LLM response.
  const context = retrieved.map(r => r.text).join("\n---\n");

  const systemPrompt =
    "You are a helpful assistant. Answer using only the provided context. " +
    "If the context does not contain the answer, say you don't know.";

  const answer = await llmClient.generate({
    system: systemPrompt,
    history: historyMessages,
    user: message,
    context,
  });

  // Persist the user and assistant turns along with source metadata for traceability.
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      content: message,
    },
  });

  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: answer,
      sources: retrieved.map(r => ({
        document_id: r.documentId,
        chunk_id: r.id,
        score: r.score,
      })),
    },
  });

  return {
    session_id: session.id,
    answer,
    sources: assistantMsg.sources,
  };
}
