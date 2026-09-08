import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000000";
    const profile = await storage.getProfile(userId);
    const hasResume = Boolean(profile?.resume_text && profile.resume_text.length > 50);

    return NextResponse.json({
      hasResume,
      charCount: profile?.resume_text?.length || 0,
      preview: profile?.resume_text ? profile.resume_text.slice(0, 300) + "..." : null,
    });
  } catch (err) {
    console.error("Resume status error:", err);
    return NextResponse.json({ error: "Failed to fetch resume status" }, { status: 500 });
  }
}
