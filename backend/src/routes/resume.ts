import { Router } from "express";
import multer from "multer";
// @ts-expect-error -- pdf-parse has no bundled types
import pdfParse from "pdf-parse";
import { supabase } from "../lib/supabase.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const resumeRouter = Router();

/**
 * POST /api/resume/upload
 * multipart/form-data: file (PDF), userId
 * Extracts resume text and stores it on the user's profile so question
 * generation can be personalized.
 */
resumeRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = req.body.userId as string | undefined;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!req.file) return res.status(400).json({ error: "file is required (PDF)" });

    const parsed = await pdfParse(req.file.buffer);
    const resumeText = parsed.text.trim();

    const { error } = await supabase
      .from("profiles")
      .update({ resume_text: resumeText })
      .eq("id", userId);

    if (error) throw error;

    res.json({ ok: true, extractedChars: resumeText.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process resume" });
  }
});
