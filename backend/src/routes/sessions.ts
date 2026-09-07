import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { generateQuestions } from "../lib/llm.js";

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(2),
  domain: z.string().optional(),
  useResume: z.boolean().optional().default(false),
  questionCount: z.number().int().min(3).max(15).optional().default(5),
});

/**
 * POST /api/sessions
 * Creates a new mock interview session and generates its questions.
 */
sessionsRouter.post("/", async (req, res) => {
  const parseResult = createSessionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }
  const { userId, role, domain, useResume, questionCount } = parseResult.data;

  try {
    let resumeText: string | undefined;
    if (useResume) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_text")
        .eq("id", userId)
        .single();
      resumeText = profile?.resume_text ?? undefined;
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({ user_id: userId, role, domain })
      .select()
      .single();
    if (sessionError) throw sessionError;

    const generated = await generateQuestions({ role, domain, resumeText, count: questionCount });

    const rows = generated.map((q, i) => ({
      session_id: session.id,
      order_index: i,
      prompt: q.prompt,
      category: q.category,
    }));

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .insert(rows)
      .select();
    if (questionsError) throw questionsError;

    res.status(201).json({ session, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

/**
 * GET /api/sessions/:id
 * Returns a session with its questions and any submitted answers.
 */
sessionsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (sessionError) throw sessionError;

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*, answers(*)")
      .eq("session_id", id)
      .order("order_index");
    if (questionsError) throw questionsError;

    res.json({ session, questions });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Session not found" });
  }
});

/**
 * GET /api/sessions?userId=...
 * Returns a user's session history for the progress-tracking dashboard.
 */
sessionsRouter.get("/", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) return res.status(400).json({ error: "userId query param is required" });

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch sessions" });
  res.json({ sessions: data });
});
