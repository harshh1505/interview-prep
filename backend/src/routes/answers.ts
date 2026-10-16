import { Router } from "express";
import { z } from "zod";
import { storage } from "../lib/storage.js";
import { evaluateAnswer, generateInterviewReport } from "../lib/gemini.js";

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
 * Finalizes session, calls Gemini to synthesize structured performance report,
 * and saves to public.interview_reports.
 */
answersRouter.post("/:sessionId/complete", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const questions = await storage.getQuestions(sessionId);
    const answers = await storage.getAnswers(sessionId);
    const resumeAnalysis = await storage.getResumeAnalysis(session.user_id);

    const qaList = questions.map((q) => {
      const ans = answers.find((a) => a.question_id === q.id);
      return {
        question: q.prompt,
        category: q.category,
        answer: ans?.answer_text || "No answer provided.",
        score: ans?.score,
        strengths: ans?.strengths,
        weaknesses: ans?.weaknesses,
        feedback: ans?.feedback,
      };
    });

    // Synthesize multi-dimensional performance report via Gemini
    const reportData = await generateInterviewReport({
      role: session.role,
      domain: session.domain,
      resumeSummary: resumeAnalysis?.summary,
      qas: qaList,
    });

    // Save report in database
    const report = await storage.saveInterviewReport({
      session_id: sessionId,
      user_id: session.user_id,
      overall_score: reportData.overall_score,
      technical_accuracy: reportData.technical_accuracy,
      communication_clarity: reportData.communication_clarity,
      depth_of_explanation: reportData.depth_of_explanation,
      resume_consistency: reportData.resume_consistency,
      key_strengths: reportData.key_strengths,
      areas_for_improvement: reportData.areas_for_improvement,
      summary_feedback: reportData.summary_feedback,
      topic_breakdown: reportData.topic_breakdown,
      question_evaluations: reportData.question_evaluations,
    });

    const updated = await storage.updateSession(sessionId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_score: reportData.overall_score,
    });

    res.json({ session: updated, report });
  } catch (err) {
    console.error("Complete session error:", err);
    res.status(500).json({ error: "Failed to complete session and generate report" });
  }
});

/**
 * GET /api/answers/:sessionId/report
 * Returns completed interview performance report
 */
answersRouter.get("/:sessionId/report", async (req, res) => {
  const { sessionId } = req.params;
  try {
    const report = await storage.getInterviewReport(sessionId);
    if (!report) {
      return res.status(404).json({ error: "Report not found for this session." });
    }
    res.json({ report });
  } catch (err) {
    console.error("Get report error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

