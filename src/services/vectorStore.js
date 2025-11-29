import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "documents";

const client = new QdrantClient({ url: QDRANT_URL });

// Ensure the target collection exists before reads/writes.
async function ensureCollection(vectorSize) {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME
  );

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
    console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
  }
}

export const vectorStore = {
  // Persist a document's chunk embeddings and text payloads.
  async addMany(documentId, embeddings, chunks) {
    if (!embeddings.length) return;

    try {
      await ensureCollection(embeddings[0].length);

      const points = embeddings.map((emb, i) => ({
        id: randomUUID(),
        vector: emb,
        payload: {
          documentId,
          index: i,
          text: chunks[i],
        },
      }));

      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points,
      });
    } catch (err) {
      const detail = err?.message || "Unknown error";
      throw new Error(`Failed to persist vectors: ${detail}`, { cause: err });
    }
  },

  // Cosine-search for the closest chunks to the provided embedding.
  async search(queryEmbedding, topK = 3) {
    try {
      await ensureCollection(queryEmbedding.length);

      const result = await client.search(COLLECTION_NAME, {
        vector: queryEmbedding,
        limit: topK,
        with_payload: true,
      });

      return result.map((hit) => ({
        id: hit.id,
        documentId: hit.payload.documentId,
        text: hit.payload.text,
        score: hit.score,
      }));
    } catch (err) {
      const detail = err?.message || "Unknown error";
      throw new Error(`Vector search failed: ${detail}`, { cause: err });
    }
  },
};
