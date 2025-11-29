import fs from "fs/promises";
import { randomUUID } from "crypto";
import { prisma } from "../../db/client.js";
import { parsePdf } from "./pdfParser.js";
import { parseDocx } from "./docxParser.js";
import { parseCsv } from "./csvParser.js";
import { parseJson } from "./jsonParser.js";
import { chunkText } from "../textChunker.js";
import { embedTexts } from "../embeddings.js";
import { vectorStore } from "../vectorStore.js";

export class UnsupportedFileTypeError extends Error {
  constructor(mimetype, filename) {
    super(`Unsupported file type: ${mimetype || "unknown"} for file ${filename}`);
    this.name = "UnsupportedFileTypeError";
    this.code = "UNSUPPORTED_FILE_TYPE";
  }
}

export async function ingestDocument(file) {
  console.log("Ingesting file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    path: file.path,
  });

  let text = "";
  const lowerName = file.originalname.toLowerCase();

  if (file.mimetype === "application/pdf" || lowerName.endsWith(".pdf")) {
    text = await parsePdf(file.path);
  } 
  else if (file.mimetype.includes("wordprocessingml") || file.mimetype === "application/msword" || lowerName.endsWith(".docx")) {
    text = await parseDocx(file.path);
  } 
  else if (file.mimetype === "text/csv" || lowerName.endsWith(".csv")) {
    text = await parseCsv(file.path);
  } 
  else if (file.mimetype === "application/json" || file.mimetype === "text/json" || lowerName.endsWith(".json")) {
    text = await parseJson(file.path);
  } 
  else if (file.mimetype === "text/plain" || lowerName.endsWith(".txt")) {
    text = await fs.readFile(file.path, "utf-8");
  } 
  else {
    console.warn("Unsupported mimetype for ingest:", file.mimetype);
    throw new UnsupportedFileTypeError(file.mimetype, file.originalname);
  }

  const normalizedText = (text || "").trim();
  if (!normalizedText) {
    throw new Error("Uploaded file contains no extractable text content");
  }

  // Chunk text into manageable pieces for embedding.
  const chunks = chunkText(normalizedText, { size: 800, overlap: 100 });
  if (!chunks.length) {
    throw new Error("No content to index from uploaded file");
  }
  const embeddings = await embedTexts(chunks);

  const documentId = randomUUID();

  // Track document metadata for source references.
  await prisma.document.create({
    data: {
      id: documentId,
      filename: file.originalname,
      mimeType: file.mimetype,
    },
  });

  // Persist chunks with embeddings for replay and audits.
  const chunkRecords = chunks.map((chunk, i) => ({
    documentId,
    index: i,
    text: chunk,
    embedding: Buffer.from(Float32Array.from(embeddings[i]).buffer),
  }));

  await prisma.chunk.createMany({ data: chunkRecords });

  // Store vectors in Qdrant for similarity search.
  await vectorStore.addMany(documentId, embeddings, chunks);

  return { documentId, chunkCount: chunks.length };
}
