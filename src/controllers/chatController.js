import { chatWithKnowledge } from "../services/chatService.js";

// Accepts a user message (optionally tied to a session) and delegates to the RAG chat service.
export async function handleChat(req, res, next) {
  try {
    const { session_id: sessionId, message } = req.body;

    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    if (sessionId !== undefined && typeof sessionId !== "string") {
      return res.status(400).json({ error: "'session_id' must be a string when provided" });
    }

    const normalizedMessage = message.trim();
    const result = await chatWithKnowledge({ sessionId, message: normalizedMessage });

    // Pretty-print for readability while keeping application/json.
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result, null, 2));
  } catch (err) {
    next(err);
  }
}
