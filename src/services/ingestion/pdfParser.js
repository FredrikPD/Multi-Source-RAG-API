// Extracts text content from PDF files during ingestion.
import fs from "fs/promises";
import pdfParse from "pdf-parse";

export async function parsePdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}
