// Script used to ingest a warranty document and capture chat responses for a fixed question set.
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

// Base URL for the local API used to ingest documents and answer questions.
const API_BASE = "http://localhost:3000";

export const WARRANTY_QUESTIONS = [
  {
    id: "warranty_coverage_duration",
    query:
      "What is the standard warranty coverage period for ACME products?",
  },
  {
    id: "warranty_included_services",
    query:
      "What services are included under ACME’s standard warranty?",
  },
  {
    id: "warranty_exclusions",
    query:
      "What types of issues or damages are excluded from ACME’s warranty coverage?",
  },
  {
    id: "warranty_claim_process",
    query:
      "What steps must a customer follow to submit a warranty claim?",
  },
  {
    id: "warranty_repair_timeline",
    query:
      "How long does ACME have to complete warranty repairs after receiving a valid claim?",
  },
  {
    id: "warranty_shipping_responsibility",
    query:
      "Who is responsible for shipping costs when sending a product in for warranty service?",
  },
];

// Absolute path to the warranty document that will be ingested before querying.
const DOCUMENT_PATH = path.join(
  process.cwd(),
  "eval",
  "documents",
  "Warranty_ServiceAgreement.docx"
);

// Uploads the warranty document to the ingestion endpoint and returns the document_id.
async function ingestDocument() {
  console.log("\nINGESTING RefundPolicy.docx");

  if (!fs.existsSync(DOCUMENT_PATH)) {
    throw new Error(`RefundPolicy.docx not found at: ${DOCUMENT_PATH}`);
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(DOCUMENT_PATH));

  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Non-JSON response from /ingest:", text);
    throw e;
  }

  console.log("Ingestion response:", data);

  if (!res.ok) {
    throw new Error(`Ingest failed: HTTP ${res.status}`);
  }

  if (!data.document_id) {
    throw new Error(`Ingest did not return document_id: ${text}`);
  }

  return data.document_id;
}

// Asks a single warranty question and returns the answer plus detailed source info.
async function askQuestion(question) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: question.query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Chat failed for ${question.id}: HTTP ${res.status} – ${text}`
    );
  }

  const data = await res.json();

  const detailedSources = (data.sources || []).map((s) => ({
    chunk_id: s.chunk_id,
    score: s.score,
    text: s.text || "",
    document_id: s.document_id,
  }));

  return {
    question_id: question.id,
    question: question.query,
    answer: data.answer,
    sources: detailedSources,
  };
}

// Executes the question set and writes the responses to a results file.
async function main() {
  const resultsDir = path.join(process.cwd(), "eval", "results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results = {};
  for (const q of WARRANTY_QUESTIONS) {
    console.log(`\nAsking: ${q.id}`);
    const output = await askQuestion(q);
    results[q.id] = output;
  }

  const outputPath = path.join(resultsDir, "Warranty_eval_output.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`Saved results to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
