import { NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { evaluateAnswer } from "@/lib/gemini";

const submitAnswerSchema = z.object({
  questionId: z.string(),
  sessionId: z.string(),
  answerText: z.string().min(1, "Answer text cannot be empty"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = submitAnswerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
    }

    const { questionId, sessionId, answerText } = parseResult.data;

    const question = await storage.getQuestion(questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const session = await storage.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

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

    return NextResponse.json({ answer }, { status: 201 });
  } catch (err) {
    console.error("Submit answer error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to evaluate answer with Gemini" },
      { status: 500 }
    );
  }
}
