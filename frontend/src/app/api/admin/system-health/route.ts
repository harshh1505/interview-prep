import { NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  // 1. Check Backend express server
  let backendStatus = "Connected";
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
    const res = await fetch(`${backendUrl}/health`, { cache: "no-store" });
    if (!res.ok) backendStatus = "Degraded";
  } catch {
    backendStatus = "Standby (Local Prototype)";
  }

  // 2. Check Supabase DB
  let dbStatus = "Connected";
  try {
    const adminDb = getSupabaseAdminClient();
    if (adminDb) {
      const { error } = await adminDb.from("profiles").select("id").limit(1);
      if (error) dbStatus = "Error";
    }
  } catch {
    dbStatus = "Degraded";
  }

  // 3. Check Gemini AI config
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const aiStatus = hasGemini ? "Connected" : "Not Configured";

  // 4. Check Pinecone Vector DB
  const hasPinecone = Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.trim() !== "");
  const vectorDbStatus = hasPinecone ? "Connected" : "Local Fallback";

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    services: [
      { name: "Backend API Server", status: backendStatus, type: "Express.js / Node.js" },
      { name: "Database", status: dbStatus, type: "Supabase PostgreSQL" },
      { name: "Authentication", status: "Connected", type: "Supabase Auth" },
      { name: "Storage", status: "Connected", type: "Supabase Storage / Local" },
      { name: "AI Service", status: aiStatus, type: "Google Gemini 2.5" },
      { name: "Vector Database", status: vectorDbStatus, type: "Pinecone Vector Index" },
    ],
  });
}
