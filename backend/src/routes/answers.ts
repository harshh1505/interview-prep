import { Router } from "express";
import { z } from "zod";
import { storage } from "../lib/storage.js";
import { evaluateAnswer } from "../lib/gemini.js";

export const answersRouter = Router();

const submitAnswerSchema = z.object({
  questionId: z.string(),
  sessionId: z.string(),
  answerText: z.string().min(1, "Answer text cannot be empty"),
});

/**
 * POST /api/answers
 * Evaluates candidate's answer via Google Gemini, storing score, strengths,
 * weaknesses, coaching feedback, and model answer structure.
 */
answersRouter.post("/", async (req, res) => {
  const parseResult = submitAnswerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { questionId, sessionId, answerText } = parseResult.data;

  try {
    const question = await storage.getQuestion(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const session = await storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Evaluate candidate response using Gemini
    const evaluation = await evaluateAnswer({
      question: question.prompt,
      answer: answerText,
      role: session.role,
      category: question.category,
      rubricCriteria: question.rubric_criteria,
    });

    const answer = await storage.insertAnswer({
      question_id: questionId,
      session_id: sessionId,
      answer_text: answerText,
      score: evaluation.score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      feedback: evaluation.feedback,
      model_answer: evaluation.modelAnswerSnippet,
      follow_up_tip: evaluation.followUpTip,
    });

    res.status(201).json({ answer });
  } catch (err) {
    console.error("Answer evaluation error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to evaluate answer with Gemini",
    });
  }
});

/**
 * POST /api/answers/:sessionId/complete
 * Finalizes session and computes the overall score.
 */
answersRouter.post("/:sessionId/complete", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const answers = await storage.getAnswers(sessionId);
    const validScores = answers
      .map((a) => a.score)
      .filter((s): s is number => typeof s === "number" && !isNaN(s));

    const overallScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((sum, val) => sum + val, 0) / validScores.length)
        : null;

    const updated = await storage.updateSession(sessionId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_score: overallScore,
    });

    res.json({ session: updated });
  } catch (err) {
    console.error("Complete session error:", err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});
