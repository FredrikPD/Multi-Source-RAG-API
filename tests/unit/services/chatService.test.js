import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all downstream dependencies before loading chatService.

vi.mock("../../../src/db/client.js", () => {
  const fakeSession = { id: "session-123", messages: [] };

  return {
    prisma: {
      session: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(fakeSession),
      },
      chatMessage: {
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: "msg-2",
            ...data,
          })
        ),
      },
    },
  };
});

vi.mock("../../../src/services/embeddings.js", () => ({
  embedTexts: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
}));

vi.mock("../../../src/services/vectorStore.js", () => ({
  vectorStore: {
    search: vi.fn().mockResolvedValue([
      {
        id: "chunk-1",
        score: 0.9,
        text: "Chunk text 1",
        documentId: "doc-1",
      },
      {
        id: "chunk-2",
        score: 0.8,
        text: "Chunk text 2",
        documentId: "doc-1",
      },
    ]),
  },
}));

vi.mock("../../../src/llm/llmClient.js", () => ({
  llmClient: {
    generate: vi.fn().mockResolvedValue("mock-answer"),
  },
  rewriteQuery: vi.fn().mockResolvedValue("rewritten question about refunds"),
}));

vi.mock("../../../src/llm/followup.js", () => ({
  isFollowUpQuestion: vi.fn().mockReturnValue(false),
  buildStandaloneQuestion: vi.fn(),
}));

// Now import the function under test
import { chatWithKnowledge } from "../../../src/services/chatService.js";
import { prisma } from "../../../src/db/client.js";
import { embedTexts } from "../../../src/services/embeddings.js";
import { vectorStore } from "../../../src/services/vectorStore.js";
import { llmClient, rewriteQuery } from "../../../src/llm/llmClient.js";
import { isFollowUpQuestion } from "../../../src/llm/followup.js";

describe("chatWithKnowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a session, rewrites query, retrieves chunks, calls LLM and returns answer + sources", async () => {
    const input = { sessionId: null, message: "What is the refund policy?" };

    const result = await chatWithKnowledge(input);

    // Session handling
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
    expect(result.session_id).toBe("session-123");

    // Follow-up detection
    expect(isFollowUpQuestion).toHaveBeenCalledWith(input.message);

    // Query rewrite
    expect(rewriteQuery).toHaveBeenCalledWith([], input.message);
    expect(embedTexts).toHaveBeenCalledWith([
      "rewritten question about refunds",
    ]);

    // Retrieval
    expect(vectorStore.search).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3],
      3 // k value
    );

    // LLM generation
    expect(llmClient.generate).toHaveBeenCalledTimes(1);
    const llmCall = llmClient.generate.mock.calls[0][0];
    expect(llmCall.user).toBe(input.message);
    expect(llmCall.context).toContain("Chunk text 1");
    expect(llmCall.context).toContain("Chunk text 2");

    // Messages saved
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);

    // Returned structure
    expect(result.answer).toBe("mock-answer");
    expect(result.sources).toEqual([
      {
        document_id: "doc-1",
        chunk_id: "chunk-1",
        score: 0.9,
        text: "Chunk text 1",
      },
      {
        document_id: "doc-1",
        chunk_id: "chunk-2",
        score: 0.8,
        text: "Chunk text 2",
      },
    ]);
  });
});
