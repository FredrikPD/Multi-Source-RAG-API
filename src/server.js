import express from "express";
import { loadEnv } from "./config/env.js";
import ingestRouter from "./routes/ingest.js";
import chatRouter from "./routes/chat.js";
import sessionsRouter from "./routes/sessions.js";


const config = loadEnv();

// Export app for testing purposes.
export const app = express();

app.use(express.json());

// API routes.
app.use("/ingest", ingestRouter);
app.use("/chat", chatRouter);
app.use("/sessions", sessionsRouter);

// Fallback error handler to keep JSON responses consistent.
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// Only start the server if we're NOT in test mode.
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`RAG API listening on port ${config.port}`);
  });
}
