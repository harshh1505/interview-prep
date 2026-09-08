import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const hasPinecone = Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.trim() !== "");

  return NextResponse.json({
    ok: true,
    services: {
      gemini: hasGemini ? "configured" : "missing_key",
      pinecone: hasPinecone ? "configured" : "using_local_fallback",
    },
    version: "0.2.0-vercel-serverless",
  });
}
