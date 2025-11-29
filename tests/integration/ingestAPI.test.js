import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import path from "path";

// Mock ingestion and downstream storage to isolate controller behavior.
vi.mock("../../src/services/ingestion/chunker.js", () => {
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

// Import app after mocks to ensure wiring picks up fakes.
import { app } from "../../src/server.js";
import { ingestDocument } from "../../src/services/ingestion/ingestService.js";

describe("POST /ingest API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 200 and payload for a valid document", async () => {
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
            .expect(200);

        expect(ingestDocument).toHaveBeenCalledTimes(1);
        expect(res.body).toEqual({
            document_id: "doc-123",
            chunks: 10,
        });
    });

    it("returns 400 for invalid document type", async () => {
        const err = new Error("Unsupported file type");
        err.code = "UNSUPPORTED_FILE_TYPE";
        ingestDocument.mockRejectedValue(err);

        const fakePngPath = path.join(
            process.cwd(),
            "tests",
            "fixtures",
            "fake.png"
        );

        const res = await request(app)
            .post("/ingest")
            .attach("file", fakePngPath)
            .expect(400);

        expect(ingestDocument).toHaveBeenCalledTimes(1);
        expect(res.body).toEqual({
            error: "Unsupported file type",
        });
    });

    it("returns 400 when no document is provided", async () => {
        const res = await request(app).post("/ingest").expect(400);

        expect(res.body).toEqual({ error: "Missing file" });
        expect(ingestDocument).not.toHaveBeenCalled();
    });
});
