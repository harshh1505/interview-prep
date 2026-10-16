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

    // 1. Fetch profile role distribution and user count
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, target_role, role, created_at")
      .order("created_at", { ascending: false });

    if (pErr) throw pErr;

    const totalUsers = profiles?.length || 0;
    const adminCount = profiles?.filter((p) => p.role === "admin").length || 0;
    const userCount = profiles?.filter((p) => p.role === "user").length || 0;

    // Active users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeUsers = profiles?.filter(
      (p) => p.created_at && p.created_at >= thirtyDaysAgo
    ).length || totalUsers;

    // Calculate daily signups for last 30 days
    const dailyRegistrations: number[] = new Array(30).fill(0);
    const nowMs = Date.now();
    profiles?.forEach((p) => {
      if (p.created_at) {
        const createdMs = new Date(p.created_at).getTime();
        const diffDays = Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 30) {
          dailyRegistrations[29 - diffDays] += 1;
        }
      }
    });

    // 2. Fetch sessions stats
    const { data: sessions, error: sErr } = await supabase
      .from("sessions")
      .select("id, role, domain, status, overall_score, created_at, user_id")
      .order("created_at", { ascending: false });

    const totalAssessments = sessions?.length || 0;
    const completedSessions = sessions?.filter((s) => s.status === "completed") || [];
    const activeSessions = sessions?.filter((s) => s.status === "in_progress").length || 0;

    const avgCompletionRate =
      totalAssessments > 0
        ? Math.round((completedSessions.length / totalAssessments) * 100)
        : 0;

    const validScores = completedSessions
      .map((s) => (s.overall_score != null ? Number(s.overall_score) : null))
      .filter((sc): sc is number => sc !== null);

    const avgPerformance =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

    const atRiskUsers = validScores.filter((sc) => sc < 60).length;

    // 3. Programs stats
    const { data: programs } = await supabase.from("programs").select("id, status");
    const totalPrograms = programs?.length || 0;
    const activePrograms = programs?.filter((p) => p.status === "active").length || 0;

    // 4. Recent activity from DB (Audit logs + new signups + sessions)
    const { data: auditLogs } = await supabase
      .from("admin_audit_logs")
      .select("id, action, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentActivity: Array<{ id: string; text: string; timeAgo: string }> = [];

    (auditLogs || []).forEach((log) => {
      const name = (log.profiles as any)?.full_name || "Admin";
      recentActivity.push({
        id: log.id,
        text: `${name}: ${log.action.replace(/_/g, " ")}`,
        timeAgo: formatTimeAgo(log.created_at),
      });
    });

    (profiles || []).slice(0, 3).forEach((p) => {
      recentActivity.push({
        id: `prof-${p.id}`,
        text: `New user account created: ${p.full_name || "User"} (${p.role})`,
        timeAgo: formatTimeAgo(p.created_at),
      });
    });

    (sessions || []).slice(0, 3).forEach((s) => {
      recentActivity.push({
        id: `sess-${s.id}`,
        text: `Mock interview session (${s.role}): ${s.status}`,
        timeAgo: formatTimeAgo(s.created_at),
      });
    });

    recentActivity.sort((a, b) => (a.id < b.id ? 1 : -1));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalPrograms,
        activePrograms,
        totalLearningPaths: totalPrograms,
        totalAssessments,
        avgCompletionRate,
        avgPerformance,
        activeSessions,
        atRiskUsers,
        roleDistribution: {
          user: userCount,
          admin: adminCount,
        },
        dailyRegistrations,
        recentActivity: recentActivity.slice(0, 5),
      },
    });
  } catch (err: any) {
    console.error("Admin stats API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics", details: err.message },
      { status: 500 }
    );
  }
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "recently";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

