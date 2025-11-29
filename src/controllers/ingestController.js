// src/controllers/ingestController.js
import { randomUUID } from "crypto";
import fs from "fs/promises";
import {ingestDocument, UnsupportedFileTypeError} from "../services/ingestion/ingestService.js";


const ingestJobs = new Map();


// Starts an async ingest job and immediately returns a job id the client can poll.
export async function startIngestion(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing file" });
    }

    const file = req.file;
    const jobId = randomUUID();

    ingestJobs.set(jobId, { status: "queued" });

    process.nextTick(async () => {
      // Move job to processing outside request lifecycle to avoid blocking the response.
      ingestJobs.set(jobId, { status: "processing" });
      try {
        const result = await ingestDocument(file);

        ingestJobs.set(jobId, {
          status: "completed",
          documentId: result.documentId,
          chunks: result.chunkCount,
        });
      } catch (err) {
        // Normalize unsupported file handling so the client can react deterministically.
        if (err instanceof UnsupportedFileTypeError ||err.code === "UNSUPPORTED_FILE_TYPE") {
          ingestJobs.set(jobId, {
            status: "error",
            error: err.message,
            code: "UNSUPPORTED_FILE_TYPE",
          });
        } else {
          console.error("Ingest job failed:", jobId, err);
          ingestJobs.set(jobId, {
            status: "error",
            error: err?.message || "Internal error during ingestion",
            code: err?.code,
          });
        }
      } finally {
        // Best-effort cleanup of the uploaded temp file.
        if (file?.path) {
          try {
            await fs.unlink(file.path);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    });

    return res.status(202).json({
      job_id: jobId,
      status: "queued",
    });
  } catch (err) {
    next(err);
  }
}


// Returns the current status for a given job id, with appropriate HTTP codes.
export function getIngestStatus(req, res) {
  const { jobId } = req.params;
  const job = ingestJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status === "completed") {
    return res.json({
      job_id: jobId,
      status: "completed",
      document_id: job.documentId,
      chunks: job.chunks,
    });
  }

  if (job.status === "error") {
    const httpStatus = job.code === "UNSUPPORTED_FILE_TYPE" ? 400 : 500;
    return res.status(httpStatus).json({
      job_id: jobId,
      status: "error",
      error: job.error,
      code: job.code,
    });
  }

  return res.json({
    job_id: jobId,
    status: job.status,
  });
}

export { ingestJobs };
