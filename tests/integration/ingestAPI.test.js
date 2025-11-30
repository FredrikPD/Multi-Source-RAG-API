import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import path from "path";

// Mock ingestion and downstream storage to isolate controller behavior.
vi.mock("../../src/services/ingestion/ingestService.js", () => {
  const ingestDocument = vi.fn();

  class UnsupportedFileTypeError extends Error {
    constructor(message = "Unsupported file type") {
      super(message);
      this.name = "UnsupportedFileTypeError";
      this.code = "UNSUPPORTED_FILE_TYPE";
    }
  }

  return {
    ingestDocument,
    UnsupportedFileTypeError,
  };
});

vi.mock("../../src/services/vectorStore.js", () => ({
  vectorStore: {
    search: vi.fn(),
    addMany: vi.fn(),
  },
}));

// Import app + ingestJobs after mocks so wiring uses the mocked services.
import { app } from "../../src/server.js";
import { ingestDocument } from "../../src/services/ingestion/ingestService.js";
import { ingestJobs } from "../../src/controllers/ingestController.js";

describe("Ingestion API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ingestJobs.clear();
  });

  describe("POST /ingest", () => {
    it("queues an ingestion job and returns 202 with job id", async () => {
      ingestDocument.mockResolvedValue({
        documentId: "doc-123",
        chunkCount: 10,
      });

      const fakeFilePath = path.join(
        process.cwd(),
        "tests",
        "fixtures",
        "test.docx"
      );

      const res = await request(app)
        .post("/ingest")
        .attach("file", fakeFilePath)
        .expect(202);

      expect(res.body).toEqual({
        job_id: expect.any(String),
        status: "queued",
      });

      // Allow nextTick + async handler to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ingestDocument).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when no document is provided", async () => {
      const res = await request(app).post("/ingest").expect(400);

      expect(res.body).toEqual({ error: "Missing file" });
      expect(ingestDocument).not.toHaveBeenCalled();
    });
  });

  describe("GET /ingest/status/:jobId", () => {
    it("returns 404 for unknown job id", async () => {
      const res = await request(app)
        .get("/ingest/status/non-existent-job")
        .expect(404);

      expect(res.body).toEqual({ error: "Job not found" });
    });

    it("returns completed status with document metadata", async () => {
      const jobId = "job-123";
      ingestJobs.set(jobId, {
        status: "completed",
        documentId: "doc-123",
        chunks: 10,
      });

      const res = await request(app)
        .get(`/ingest/status/${jobId}`)
        .expect(200);

      expect(res.body).toEqual({
        job_id: jobId,
        status: "completed",
        document_id: "doc-123",
        chunks: 10,
      });
    });

    it("returns 400 for an error job with UNSUPPORTED_FILE_TYPE", async () => {
      const jobId = "job-unsupported";
      ingestJobs.set(jobId, {
        status: "error",
        error: "Unsupported file type",
        code: "UNSUPPORTED_FILE_TYPE",
      });

      const res = await request(app)
        .get(`/ingest/status/${jobId}`)
        .expect(400);

      expect(res.body).toEqual({
        job_id: jobId,
        status: "error",
        error: "Unsupported file type",
        code: "UNSUPPORTED_FILE_TYPE",
      });
    });

    it("returns 500 for a generic error job", async () => {
      const jobId = "job-generic-error";
      ingestJobs.set(jobId, {
        status: "error",
        error: "Something went wrong",
        code: "INTERNAL",
      });

      const res = await request(app)
        .get(`/ingest/status/${jobId}`)
        .expect(500);

      expect(res.body).toEqual({
        job_id: jobId,
        status: "error",
        error: "Something went wrong",
        code: "INTERNAL",
      });
    });

    it("returns queued/processing status as-is", async () => {
      const queuedId = "job-queued";
      const processingId = "job-processing";

      ingestJobs.set(queuedId, { status: "queued" });
      ingestJobs.set(processingId, { status: "processing" });

      const queuedRes = await request(app)
        .get(`/ingest/status/${queuedId}`)
        .expect(200);

      expect(queuedRes.body).toEqual({
        job_id: queuedId,
        status: "queued",
      });

      const processingRes = await request(app)
        .get(`/ingest/status/${processingId}`)
        .expect(200);

      expect(processingRes.body).toEqual({
        job_id: processingId,
        status: "processing",
      });
    });
  });
});