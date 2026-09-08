import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await storage.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const questions = await storage.getQuestions(id);
    const answers = await storage.getAnswers(id);

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answers.filter((a) => a.question_id === q.id),
    }));

    return NextResponse.json({ session, questions: questionsWithAnswers });
  } catch (err) {
    console.error("Get session error:", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
