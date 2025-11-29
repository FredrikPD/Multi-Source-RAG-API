import { Router } from "express";
import { handleChat } from "../controllers/chatController.js";

const router = Router();

// Accepts chat requests and delegates to controller.
router.post("/", handleChat);

export default router;
