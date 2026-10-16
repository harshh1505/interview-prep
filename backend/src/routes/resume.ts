import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { storage } from "../lib/storage.js";
import { indexResumeChunks } from "../lib/pinecone.js";
import { analyzeResume } from "../lib/gemini.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const resumeRouter = Router();

/**
 * POST /api/resume/upload
 * multipart/form-data: file (PDF), userId
 * Extracts resume text, divides into semantic chunks, generates Gemini embeddings,
 * analyzes structured profile skills/projects, and saves into Supabase public.resume_analysis.
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

    // Deep Gemini analysis to populate public.resume_analysis
    const analysis = await analyzeResume(resumeText);
    const savedAnalysis = await storage.saveResumeAnalysis({
      user_id: userId,
      raw_text: resumeText,
      summary: analysis.summary,
      skills: analysis.skills,
      technologies: analysis.technologies,
      projects: analysis.projects,
      experience: analysis.experience,
      interview_topics: analysis.interview_topics,
      potential_weaknesses: analysis.potential_weaknesses,
    });

    res.json({
      ok: true,
      extractedChars: resumeText.length,
      chunkCount: indexResult.chunkCount,
      sections: indexResult.sections,
      sampleChunks: indexResult.sampleChunks,
      storage: indexResult.storage,
      analysis: savedAnalysis,
      message: `Resume successfully analyzed with Gemini, indexed into vector store, and stored in public.resume_analysis.`,
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
    const analysis = await storage.getResumeAnalysis(userId);
    const hasResume = Boolean(profile?.resume_text && profile.resume_text.length > 50);

    res.json({
      hasResume,
      charCount: profile?.resume_text?.length || 0,
      preview: profile?.resume_text ? profile.resume_text.slice(0, 300) + "..." : null,
      analysis,
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Failed to fetch resume status" });
  }
});

/**
 * GET /api/resume/analysis?userId=...
 * Returns structured resume analysis from database
 */
resumeRouter.get("/analysis", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "00000000-0000-0000-0000-000000000000";
    const analysis = await storage.getResumeAnalysis(userId);
    if (!analysis) {
      return res.status(404).json({ error: "No resume analysis found for user." });
    }
    res.json({ analysis });
  } catch (err) {
    console.error("Fetch analysis error:", err);
    res.status(500).json({ error: "Failed to fetch resume analysis" });
  }
});

