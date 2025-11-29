import { Router } from "express";
import { getSessionHistory } from "../controllers/sessionController.js";

const router = Router();

// Fetch chat history for a given session id.
router.get("/:id", getSessionHistory);

export default router;
