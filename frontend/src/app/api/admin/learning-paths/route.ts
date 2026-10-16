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

    const { data: dbPrograms, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: enrollments } = await supabase
      .from("program_enrollments")
      .select("program_id, progress, status");

    const enrollmentMap: Record<string, { count: number; totalProgress: number }> = {};
    (enrollments || []).forEach((e) => {
      if (!enrollmentMap[e.program_id]) {
        enrollmentMap[e.program_id] = { count: 0, totalProgress: 0 };
      }
      enrollmentMap[e.program_id].count += 1;
      enrollmentMap[e.program_id].totalProgress += Number(e.progress || 0);
    });

    const learningPaths = (dbPrograms || []).map((p) => {
      const stats = enrollmentMap[p.id] || { count: 0, totalProgress: 0 };
      const avgProgress = stats.count > 0 ? Math.round(stats.totalProgress / stats.count) : 0;

      return {
        id: p.id,
        title: p.title,
        domain: p.domain || "General",
        assignedUsers: stats.count,
        modulesCount: 10,
        completedModules: stats.count > 0 ? Math.round((avgProgress / 100) * 10) : 0,
        avgProgress,
        status: p.status === "active" ? "Active" : "Inactive",
      };
    });

    return NextResponse.json({
      success: true,
      learningPaths,
    });
  } catch (err: any) {
    console.error("Learning paths API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch learning paths", details: err.message },
      { status: 500 }
    );
  }
}

