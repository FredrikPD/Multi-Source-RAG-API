import fs from "fs/promises";

export async function parseJson(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  // Return raw JSON string; formatting is deferred to downstream consumers.
  return content;
}
