import { NextRequest, NextResponse } from "next/server";
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

    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category || "system",
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    }));

    return NextResponse.json({
      success: true,
      notifications: formatted,
    });
  } catch (err: any) {
    console.error("Admin notifications API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: err.message },
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
    const { title, message, category } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const newNotif = {
      title,
      message,
      category: category || "announcement",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("admin_notifications")
      .insert(newNotif)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Notification created successfully.",
      notification: data || newNotif,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

