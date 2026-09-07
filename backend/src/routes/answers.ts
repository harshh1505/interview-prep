import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { evaluateAnswer } from "../lib/llm.js";

export const answersRouter = Router();

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  sessionId: z.string().uuid(),
  answerText: z.string().min(1),
});

/**
 * POST /api/answers
 * Submits an answer, evaluates it via the LLM, and stores score + feedback.
 */
answersRouter.post("/", async (req, res) => {
  const parseResult = submitAnswerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }
  const { questionId, sessionId, answerText } = parseResult.data;

  try {
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("prompt")
      .eq("id", questionId)
      .single();
    if (questionError) throw questionError;

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("role")
      .eq("id", sessionId)
      .single();
    if (sessionError) throw sessionError;

    const evaluation = await evaluateAnswer({
      question: question.prompt,
      answer: answerText,
      role: session.role,
    });

    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .insert({
        question_id: questionId,
        session_id: sessionId,
        answer_text: answerText,
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        feedback: evaluation.feedback,
      })
      .select()
      .single();
    if (answerError) throw answerError;

    res.status(201).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

/**
 * POST /api/answers/:sessionId/complete
 * Marks a session complete and computes the overall average score.
 */
answersRouter.post("/:sessionId/complete", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("score")
      .eq("session_id", sessionId);
    if (answersError) throw answersError;

    const scores = (answers ?? []).map((a) => a.score).filter((s): s is number => s != null);
    const overallScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const { data: session, error } = await supabase
      .from("sessions")
      .update({ status: "completed", completed_at: new Date().toISOString(), overall_score: overallScore })
      .eq("id", sessionId)
      .select()
      .single();
    if (error) throw error;

    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});
