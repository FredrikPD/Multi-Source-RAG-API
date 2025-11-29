import { prisma } from "../db/client.js";

// Returns a session's message history ordered chronologically.
export async function getSessionHistory(req, res, next) {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({ error: "Missing or invalid session id" });
    }

    // Fetch the session and its messages in ascending order to preserve conversation flow.
    const session = await prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Only expose fields relevant to the client-facing history payload.
    const output = {
      session_id: session.id,
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources
      }))
    };

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(output, null, 2));
    
  } catch (err) {
    next(err);
  }
}
