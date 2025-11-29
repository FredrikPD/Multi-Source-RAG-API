import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock chat service before app import to keep the route handler isolated.
vi.mock("../../src/services/chatService.js", () => {
  return {
    chatWithKnowledge: vi.fn(),
  };
});

vi.mock("../../src/services/vectorStore.js", () => ({
  vectorStore: {
    search: vi.fn(),
    addMany: vi.fn(),
  },
}));

// Import app after mocks to guarantee injection.
import { app } from "../../src/server.js";
import { chatWithKnowledge } from "../../src/services/chatService.js";

describe("POST /chat API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and bubbles up chatWithKnowledge result", async () => {
    // Arrange: what the service should return
    chatWithKnowledge.mockResolvedValue({
      session_id: "test-session-123",
      answer: "This is a mocked answer.",
      sources: [
        {
          document_id: "doc-1",
          chunk_id: "chunk-1",
          score: 0.9,
        },
      ],
    });

    const payload = { message: "What is the refund policy?" };
    const res = await request(app).post("/chat").send(payload).expect(200);

    // Assert: service was called correctly
    expect(chatWithKnowledge).toHaveBeenCalledTimes(1);
    expect(chatWithKnowledge).toHaveBeenCalledWith({
      sessionId: undefined,
      message: "What is the refund policy?",
    });

    // Assert: API response shape
    expect(res.body).toEqual({
      session_id: "test-session-123",
      answer: "This is a mocked answer.",
      sources: [
        {
          document_id: "doc-1",
          chunk_id: "chunk-1",
          score: 0.9,
        },
      ],
    });
  });

  it("returns 400 if message is missing", async () => {
    const res = await request(app).post("/chat").send({}).expect(400);

    expect(res.body).toEqual({
      error: "Missing 'message' in body",
    });

    expect(chatWithKnowledge).not.toHaveBeenCalled();
  });
});
