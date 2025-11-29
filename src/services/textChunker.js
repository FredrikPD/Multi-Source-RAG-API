// Splits text into fixed-size overlapping chunks for downstream embedding and storage.
export function chunkText(text, { size = 800, overlap = 100 } = {}) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks = [];

  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + size, cleaned.length);
    const chunk = cleaned.slice(start, end);
    chunks.push(chunk);
    if (end === cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}
