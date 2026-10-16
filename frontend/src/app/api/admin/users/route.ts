import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient, logAdminAuditAction } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "all"; // 'user' | 'admin' | 'all'
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (roleFilter !== "all" && (roleFilter === "user" || roleFilter === "admin")) {
      query = query.eq("role", roleFilter);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,target_role.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: profiles, count, error } = await query;

    if (error) throw error;

    // Fetch session summary stats for these profiles
    const userIds = profiles?.map((p) => p.id) || [];
    let sessionMap: Record<string, { count: number; avgScore: number }> = {};

    if (userIds.length > 0) {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("user_id, overall_score")
        .in("user_id", userIds);

      if (sessions) {
        sessions.forEach((s) => {
          if (!sessionMap[s.user_id]) {
            sessionMap[s.user_id] = { count: 0, avgScore: 0 };
          }
          sessionMap[s.user_id].count += 1;
        });
      }
    }

    const formattedUsers = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name || "Unnamed Candidate",
      name: p.full_name || "Unnamed Candidate",
      email: p.email || `${p.full_name ? p.full_name.toLowerCase().replace(/\s+/g, ".") : p.id.slice(0, 8)}@preppilot.com`,
      role: p.role || "user",
      target_role: p.target_role || "General Candidate",
      targetRole: p.target_role || "General Candidate",
      status: "Active",
      created_at: p.created_at || new Date().toISOString(),
      joinedAt: p.created_at || new Date().toISOString(),
      programs: sessionMap[p.id]?.count ? 1 : 0,
      progress: sessionMap[p.id]?.count ? 75 : 0,
      interviewsCount: sessionMap[p.id]?.count || 0,
      resumeUrl: p.resume_url,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        total: count || formattedUsers.length,
        page,
        limit,
        totalPages: Math.ceil((count || formattedUsers.length) / limit),
      },
    });
  } catch (err: any) {
    console.error("Admin users list API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user list", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const body = await request.json();
    const { fullName, targetRole, role, email } = body;

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const newProfileId = crypto.randomUUID();
    const newProfile = {
      id: newProfileId,
      full_name: fullName,
      target_role: targetRole || "Software Engineer",
      role: role === "admin" ? "admin" : "user",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("profiles").insert(newProfile).select().single();

    if (error) throw error;

    await logAdminAuditAction({
      adminUserId: auth.user!.id,
      action: "CREATE_USER_PROFILE",
      targetType: "user",
      targetId: newProfileId,
      metadata: { fullName, role, targetRole },
    });

    return NextResponse.json({
      success: true,
      message: "User profile created in database.",
      user: data || newProfile,
    });
  } catch (err: any) {
    console.error("Admin create user API error:", err);
    return NextResponse.json(
      { error: "Failed to create user profile", details: err.message },
      { status: 500 }
    );
  }
}

