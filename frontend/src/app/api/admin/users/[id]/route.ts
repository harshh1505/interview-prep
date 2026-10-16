import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient, logAdminAuditAction } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const userId = params.id;
    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    // Fetch user profile
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (pErr || !profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    // Fetch user sessions & answers
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*, questions(*, answers(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const userSessions = sessions || [];
    const completedSessions = userSessions.filter((s) => s.status === "completed");
    const scores = completedSessions
      .map((s) => (s.overall_score != null ? Number(s.overall_score) : null))
      .filter((s): s is number => s !== null);

    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    // Collect all strengths & weaknesses
    const strengthsSet = new Set<string>();
    const weaknessesSet = new Set<string>();

    userSessions.forEach((s) => {
      s.questions?.forEach((q: any) => {
        q.answers?.forEach((a: any) => {
          a.strengths?.forEach((st: string) => strengthsSet.add(st));
          a.weaknesses?.forEach((wk: string) => weaknessesSet.add(wk));
        });
      });
    });

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        fullName: profile.full_name || "Unnamed User",
        targetRole: profile.target_role || "General",
        role: profile.role || "user",
        resumeText: profile.resume_text,
        resumeUrl: profile.resume_url,
        createdAt: profile.created_at,
        status: "active",
        metrics: {
          totalSessions: userSessions.length,
          completedSessions: completedSessions.length,
          avgScore,
          strengths: Array.from(strengthsSet).slice(0, 10),
          weaknesses: Array.from(weaknessesSet).slice(0, 10),
        },
        sessions: userSessions,
      },
    });
  } catch (err: any) {
    console.error("Admin user detail API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user details", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const targetUserId = params.id;
    const body = await request.json();
    const { role, status } = body;

    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified. Must be 'user' or 'admin'." },
        { status: 400 }
      );
    }

    // Safety check: prevent admin from demoting themselves if they are the current logged-in admin
    if (targetUserId === auth.user?.id && role === "user") {
      return NextResponse.json(
        { error: "You cannot demote your own administrator account." },
        { status: 400 }
      );
    }

    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;

    const { data: updatedProfile, error: updateErr } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Record audit log
    await logAdminAuditAction({
      adminUserId: auth.user!.id,
      action: role ? `ROLE_CHANGE_${role.toUpperCase()}` : "UPDATE_USER_STATUS",
      targetType: "user",
      targetId: targetUserId,
      metadata: { previousRole: auth.profile?.role, newRole: role, status },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated successfully to '${role}'.`,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("Admin update user API error:", err);
    return NextResponse.json(
      { error: "Failed to update user", details: err.message },
      { status: 500 }
    );
  }
}
