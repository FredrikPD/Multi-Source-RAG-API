import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock Prisma before loading the app to control DB responses.
const { findUniqueMock } = vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
}));

vi.mock("../../src/db/client.js", () => ({
    prisma: {
        session: {
            findUnique: findUniqueMock,
        },
    },
}));

vi.mock("../../src/services/vectorStore.js", () => ({
  vectorStore: {
    search: vi.fn(),
    addMany: vi.fn(),
  },
}));

// Import app after mocks so controllers use the stubbed Prisma client.
import { app } from "../../src/server.js";

describe("GET /sessions/:id", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 404 for invalid ID", async () => {
        findUniqueMock.mockResolvedValue(null);
        const res = await request(app).get("/sessions/non-existing-id").expect(404);

        expect(findUniqueMock).toHaveBeenCalledWith({
            where: { id: "non-existing-id" },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        expect(res.body).toEqual({ error: "Session not found" });
    });

    it("returns 200 and session for valid ID", async () => {
        const fakeSession = {
            id: "session-123",
            createdAt: new Date("2025-01-01T10:00:00Z"),
            messages: [
                {
                    id: "msg-1",
                    role: "user",
                    content: "Hello",
                    createdAt: new Date("2025-01-01T10:01:00Z"),
                    sources: null,
                },
                {
                    id: "msg-2",
                    role: "assistant",
                    content: "Hi there",
                    createdAt: new Date("2025-01-01T10:02:00Z"),
                    sources: [],
                },
            ],
        };

        findUniqueMock.mockResolvedValue(fakeSession);

        const res = await request(app)
            .get("/sessions/session-123")
            .expect(200);

        expect(findUniqueMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "session-123" },
            }),
        );

        expect(res.body).toEqual({
            session_id: "session-123",
            messages: [
                {
                    role: "user",
                    content: "Hello",
                    sources: null,
                },
                {
                    role: "assistant",
                    content: "Hi there",
                    sources: [],
                },
            ],
        });
    });
});
