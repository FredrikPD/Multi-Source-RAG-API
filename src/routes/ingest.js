import { Router } from "express";
import multer from "multer";
import { startIngestion, getIngestStatus } from "../controllers/ingestController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// Start ingestion job asynchronously.
router.post("/", upload.single("file"), startIngestion);

// Poll ingestion job status.
router.get("/status/:jobId", getIngestStatus);

export default router;
