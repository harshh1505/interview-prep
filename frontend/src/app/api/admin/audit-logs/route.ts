import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const { data: logs, error } = await supabase
      .from("admin_audit_logs")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const formatted = (logs || []).map((l) => ({
      id: l.id,
      adminUserId: l.admin_user_id,
      adminName: l.profiles?.full_name || "Administrator Account",
      action: l.action,
      targetType: l.target_type || "system",
      targetId: l.target_id || "-",
      metadata: l.metadata || {},
      createdAt: l.created_at,
    }));

    return NextResponse.json({
      success: true,
      auditLogs: formatted,
    });
  } catch (err: any) {
    console.error("Admin audit logs API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: err.message },
      { status: 500 }
    );
  }
}

