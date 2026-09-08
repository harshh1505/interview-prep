import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
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

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("Complete session error:", err);
    return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
  }
}
