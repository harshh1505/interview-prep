import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { storage } from "../lib/storage.js";
import { indexResumeChunks } from "../lib/pinecone.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const resumeRouter = Router();

/**
 * POST /api/resume/upload
 * multipart/form-data: file (PDF), userId
 * Extracts resume text, divides into semantic chunks, generates Gemini embeddings,
 * and upserts into Pinecone vector database.
 */
resumeRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = (req.body.userId as string) || "00000000-0000-0000-0000-000000000000";
    if (!req.file) {
      return res.status(400).json({ error: "PDF resume file is required" });
    }

    // Extract text from uploaded PDF
    let resumeText = "";
    try {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text.trim();
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr);
      return res.status(400).json({ error: "Failed to read text from PDF. Ensure it is a valid text-based PDF." });
    }

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: "Extracted resume text is too short or empty. Please ensure the PDF has selectable text.",
      });
    }

    // Chunk and index into Pinecone with Gemini embeddings
    const indexResult = await indexResumeChunks({
      userId,
      resumeText,
      fileName: req.file.originalname,
    });

    // Save extracted text to profile storage
    await storage.saveResumeText(userId, resumeText);

    res.json({
      ok: true,
      extractedChars: resumeText.length,
      chunkCount: indexResult.chunkCount,
      sections: indexResult.sections,
      sampleChunks: indexResult.sampleChunks,
      storage: indexResult.storage,
      message: `Resume successfully parsed into ${indexResult.chunkCount} semantic chunks and indexed via ${indexResult.storage === "pinecone" ? "Pinecone Serverless" : "local vector memory"}.`,
    });
  } catch (err) {
    console.error("Resume upload & indexing error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to process resume and index into Pinecone",
    });
  }
});

/**
 * GET /api/resume/status?userId=...
 * Returns resume indexing status for the user
 */
resumeRouter.get("/status", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "00000000-0000-0000-0000-000000000000";
    const profile = await storage.getProfile(userId);
    const hasResume = Boolean(profile?.resume_text && profile.resume_text.length > 50);

    res.json({
      hasResume,
      charCount: profile?.resume_text?.length || 0,
      preview: profile?.resume_text ? profile.resume_text.slice(0, 300) + "..." : null,
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Failed to fetch resume status" });
  }
});
