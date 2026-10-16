import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, getSupabaseAdminClient } from "@/lib/admin-auth";
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
    const sessionId = params.id;
    const adminDb = getSupabaseAdminClient();
    const supabase = adminDb || (await createSupabaseServerClient());

    const { data: session, error } = await supabase
      .from("sessions")
      .select("*, profiles(full_name, role), questions(*, answers(*))")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Assessment session not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assessment: session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch assessment detail", details: err.message },
      { status: 500 }
    );
  }
}
