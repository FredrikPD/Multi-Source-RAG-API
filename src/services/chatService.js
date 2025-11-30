import { prisma } from "../db/client.js";
import { embedTexts } from "./embeddings.js";
import { vectorStore } from "./vectorStore.js";
import { llmClient } from "../llm/llmClient.js";
import { rewriteQuery } from "../llm/queryEnhancement.js";
import { isFollowUpQuestion, buildStandaloneQuestion } from "../llm/followup.js";
import { randomUUID } from "crypto";

export async function chatWithKnowledge({ sessionId, message }) {
  // First decide which session to use based on message + optional sessionId.
  let session = null;
  const followUp = isFollowUpQuestion(message);

  // 1) Explicit session id → always try to load that one
  if (sessionId) {
    session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // 2) No explicit session, but it's a follow-up → attach to most recent session
  if (!session && followUp) {
    const lastSession = await prisma.session.findFirst({
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    // Only use it if there is actually history to follow up on
    if (lastSession && lastSession.messages.length > 0) {
      session = lastSession;
    }
  }

  // 3) Still no session? Create a brand new one
  if (!session) {
    session = await prisma.session.create({ data: { id: randomUUID() } });
    // It will have no messages yet
    session.messages = [];
  }

  const historyMessages =
    session.messages?.map(m => ({ role: m.role, content: m.content })) || [];

  // Turn vague follow-ups into standalone questions to improve retrieval.
  let effectiveUserQuestion = message;

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

  // Query enhancement still uses the original message + history.
  let effectiveQuery = effectiveUserQuestion;
  try {
    const rewritten = await rewriteQuery(historyMessages, message);
    if (rewritten && rewritten.length > 0) {
      effectiveQuery = rewritten;
      console.log("Enhanced query:", effectiveQuery);
    }
  } catch (err) {
    console.warn("Query rewrite failed, falling back to original message:", err);
  }

  // Retrieve top chunks using the enhanced query wording.
  const [queryEmbedding] = await embedTexts([effectiveQuery]);
  const retrieved = await vectorStore.search(queryEmbedding, 3);

  const context = retrieved.map(r => r.text).join("\n---\n");

  const systemPrompt =
    "You are a helpful assistant. Answer using only the provided context. " +
    "If the context does not contain the answer, say you don't know.";

  // Generate the final answer using the original phrasing but retrieved context.
  const answer = await llmClient.generate({
    system: systemPrompt,
    history: historyMessages,
    user: message,
    context,
  });

  // Persist user and assistant turns for future context and auditing.
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