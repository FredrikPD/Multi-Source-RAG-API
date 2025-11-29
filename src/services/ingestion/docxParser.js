// Extracts raw text from DOCX uploads using mammoth.
import fs from "fs/promises";
import mammoth from "mammoth";

export async function parseDocx(filePath) {
  const buffer = await fs.readFile(filePath);
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}
