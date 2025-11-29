import fs from "fs";
import { parse } from "csv-parse";

export async function parseCsv(filePath) {
  const rows = [];
  return new Promise((resolve, reject) => {
    // Stream rows to avoid loading entire file into memory at once.
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true }))
      .on("data", row => rows.push(row))
      .on("end", () => resolve(JSON.stringify(rows)))
      .on("error", reject);
  });
}
