import { Router } from "express";
import { z } from "zod";
import { storage } from "../lib/storage.js";
import { generateQuestions } from "../lib/gemini.js";
import { queryResumeContext } from "../lib/pinecone.js";

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  userId: z.string().optional().default("00000000-0000-0000-0000-000000000000"),
  role: z.string().min(2),
  domain: z.string().optional(),
  difficulty: z.enum(["entry", "mid", "senior"]).optional().default("mid"),
  useResume: z.boolean().optional().default(false),
  questionCount: z.number().int().min(2).max(15).optional().default(5),
});

/**
 * POST /api/sessions
 * Creates a new mock interview session and generates questions grounded in
 * Pinecone resume chunks and role context via Google Gemini.
 */
sessionsRouter.post("/", async (req, res) => {
  const parseResult = createSessionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { userId, role, domain, difficulty, useResume, questionCount } = parseResult.data;

  try {
    let resumeChunks: string[] = [];
    let resumeText: string | undefined;

    if (useResume) {
      console.log(`[Sessions] Querying Pinecone vector store for candidate resume context (${role})...`);
      const retrieved = await queryResumeContext({
        userId,
        query: `${role} ${domain || ""} key projects technologies architecture accomplishments technical challenges`,
        topK: 6,
      });

      if (retrieved.length > 0) {
        resumeChunks = retrieved.map((r) => r.text);
        console.log(`[Sessions] Retrieved ${retrieved.length} relevant resume chunks from Pinecone vectors.`);
      } else {
        const profile = await storage.getProfile(userId);
        resumeText = profile?.resume_text || undefined;
      }
    }

    // Create session record in storage
    const session = await storage.createSession({ userId, role, domain });

    // Generate questions with Google Gemini
    const generated = await generateQuestions({
      role,
      domain,
      difficulty,
      resumeChunks,
      resumeText,
      count: questionCount,
    });

    // Save questions with rubric and resume metadata
    const questionRows = generated.map((q, i) => ({
      session_id: session.id,
      order_index: i,
      prompt: q.prompt,
      category: q.category,
      tailored_from_resume: q.tailoredFromResume,
      resume_snippet: q.resumeContextSnippet,
      rubric_criteria: q.rubricCriteria,
    }));

    const questions = await storage.insertQuestions(questionRows);

    res.status(201).json({
      session,
      questions,
      retrievedChunksCount: resumeChunks.length,
    });
  } catch (err) {
    console.error("Session creation error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create session and generate questions",
    });
  }
});

/**
 * GET /api/sessions/:id
 * Returns a session with its questions and any submitted answers.
 */
sessionsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const session = await storage.getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const questions = await storage.getQuestions(id);
    const answers = await storage.getAnswers(id);

    // Merge answers into questions
    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answers.filter((a) => a.question_id === q.id),
    }));

    res.json({ session, questions: questionsWithAnswers });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

/**
 * GET /api/sessions?userId=...
 * Returns a user's session history.
 */
sessionsRouter.get("/", async (req, res) => {
  const userId = (req.query.userId as string) || "00000000-0000-0000-0000-000000000000";

  try {
    const sessions = await storage.listSessions(userId);
    res.json({ sessions });
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});
