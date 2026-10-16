import { NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*, profiles(full_name, role), questions(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (sessions || []).map((s) => ({
      id: s.id,
      role: s.role,
      domain: s.domain || "General",
      candidateName: s.profiles?.full_name || "Candidate",
      candidateId: s.user_id,
      status: s.status,
      overallScore: s.overall_score != null ? Math.round(Number(s.overall_score)) : null,
      questionCount: s.questions?.length || 0,
      createdAt: s.created_at,
    }));

    return NextResponse.json({
      success: true,
      assessments: formatted,
    });
  } catch (err: any) {
    console.error("Admin assessments API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch assessments", details: err.message },
      { status: 500 }
    );
  }
}
