import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { evalCases } from "./cases.js";

const API_BASE = "http://localhost:3000";

async function runEvaluation() {
  console.log("Running Evaluation");

  const caseResults = [];

  for (const test of evalCases) {
    console.log(`Evaluating: ${test.id}`);

    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: test.query }),
    });

    if (!res.ok) {
      console.error(`Chat failed for ${test.id}:`, await res.text());
      continue;
    }

    const data = await res.json();
    const returnedChunkIds = (data.sources || []).map((s) => s.chunk_id);

    const relevant = new Set(test.relevantChunks);
    const returned = new Set(returnedChunkIds);

    const tp = [...returned].filter((id) => relevant.has(id)).length;
    const fp = [...returned].filter((id) => !relevant.has(id)).length;
    const fn = [...relevant].filter((id) => !returned.has(id)).length;

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 =
      precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    const result = {
      id: test.id,
      tp,
      fp,
      fn,
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
    };

    caseResults.push(result);

    console.log(
      `→ ${test.id}: P=${result.precision}, R=${result.recall}, F1=${result.f1}`
    );
  }

  // ---- Aggregate summary metrics ----
  const totalCases = caseResults.length;

  const macroPrecision =
    totalCases === 0
      ? 0
      : Number(
          (
            caseResults.reduce((sum, r) => sum + r.precision, 0) / totalCases
          ).toFixed(4)
        );

  const macroRecall =
    totalCases === 0
      ? 0
      : Number(
          (caseResults.reduce((sum, r) => sum + r.recall, 0) / totalCases).toFixed(4)
        );

  const macroF1 =
    totalCases === 0
      ? 0
      : Number(
          (caseResults.reduce((sum, r) => sum + r.f1, 0) / totalCases).toFixed(4)
        );

  // Accuracy = fraction of cases where at least one relevant chunk was retrieved,
  // evaluated only on cases that actually have ground-truth chunks.
  const casesWithGroundTruth = caseResults.filter((_, i) => {
    return evalCases[i].relevantChunks && evalCases[i].relevantChunks.length > 0;
  });

  const correctCases = casesWithGroundTruth.filter((r, i) => {
    // For each such case, TP>0 means we retrieved at least one relevant chunk
    return r.tp > 0;
  }).length;

  const accuracy =
    casesWithGroundTruth.length === 0
      ? null
      : Number(
          (correctCases / casesWithGroundTruth.length).toFixed(4)
        );

  const summary = {
    totalCases,
    macroPrecision,
    macroRecall,
    macroF1,
    accuracy,
  };

  // ---- Save JSON (compact) ----
  const outputDir = path.join(process.cwd(), "eval", "results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "evaluation.json");
  const payload = {
    summary,
    cases: caseResults,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

  console.log(`\n📁 Saved compact evaluation results to: ${outputPath}\n`);
  console.log("Summary:", summary);
}

runEvaluation().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});