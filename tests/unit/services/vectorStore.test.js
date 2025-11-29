import { describe, it, expect, vi } from "vitest";

// Mock Qdrant client constructor to avoid network calls and control responses.
vi.mock("@qdrant/js-client-rest", () => {
  class QdrantClient {
    constructor() {}

    async getCollections() {
      return {
        collections: [{ name: "documents" }],
      };
    }

    async createCollection() {
      // no-op for tests
    }

    async search() {
      return [
        {
          id: "chunk1",
          payload: { text: "Hello world", documentId: "doc1" },
          score: 0.9,
        },
        {
          id: "chunk2",
          payload: { text: "Another chunk", documentId: "doc2" },
          score: 0.8,
        },
      ];
    }
  }

  return {
    __esModule: true,
    QdrantClient,
  };
});

// Now import the vectorStore after mocking QdrantClient.
import { vectorStore } from "../../../src/services/vectorStore.js";

describe("vectorStore.search", () => {
  it("maps Qdrant search results into simplified objects", async () => {
    const dummyEmbedding = Array(5).fill(0.1);

    const results = await vectorStore.search(dummyEmbedding, 2);

    expect(results).toEqual([
      {
        id: "chunk1",
        documentId: "doc1",
        text: "Hello world",
        score: 0.9,
      },
      {
        id: "chunk2",
        documentId: "doc2",
        text: "Another chunk",
        score: 0.8,
      },
    ]);
  });
});
