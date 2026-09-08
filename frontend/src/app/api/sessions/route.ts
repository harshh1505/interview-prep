import { NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { generateQuestions } from "@/lib/gemini";
import { queryResumeContext } from "@/lib/pinecone";

export const dynamic = "force-dynamic";

const createSessionSchema = z.object({
  userId: z.string().optional().default("00000000-0000-0000-0000-000000000000"),
  role: z.string().min(2),
  domain: z.string().optional(),
  difficulty: z.enum(["entry", "mid", "senior"]).optional().default("mid"),
  useResume: z.boolean().optional().default(false),
  questionCount: z.number().int().min(2).max(15).optional().default(5),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = createSessionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const { userId, role, domain, difficulty, useResume, questionCount } = parseResult.data;

    let resumeChunks: string[] = [];
    let resumeText: string | undefined;

    if (useResume) {
      const retrieved = await queryResumeContext({
        userId,
        query: `${role} ${domain || ""} key projects technologies architecture accomplishments technical challenges`,
        topK: 6,
      });

      if (retrieved.length > 0) {
        resumeChunks = retrieved.map((r) => r.text);
      } else {
        const profile = await storage.getProfile(userId);
        resumeText = profile?.resume_text || undefined;
      }
    }

    const session = await storage.createSession({ userId, role, domain });

    const generated = await generateQuestions({
      role,
      domain,
      difficulty,
      resumeChunks,
      resumeText,
      count: questionCount,
    });

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

    return NextResponse.json({
      session,
      questions,
      retrievedChunksCount: resumeChunks.length,
    });
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session and generate questions" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000000";
    const sessions = await storage.listSessions(userId);
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("List sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
