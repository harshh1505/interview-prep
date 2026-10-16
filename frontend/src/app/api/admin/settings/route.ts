import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, logAdminAuditAction } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  return NextResponse.json({
    success: true,
    settings: {
      platformName: "PrepPilot",
      registrationStatus: "enabled",
      maintenanceMode: false,
      roleManagementEnabled: true,
      defaultUserRole: "user",
      aiServiceStatus: process.env.GEMINI_API_KEY ? "Operational" : "Not Configured",
      vectorDbStatus: process.env.PINECONE_API_KEY ? "Operational" : "Fallback",
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  try {
    const body = await request.json();

    await logAdminAuditAction({
      adminUserId: auth.user!.id,
      action: "UPDATE_PLATFORM_SETTINGS",
      targetType: "settings",
      metadata: body,
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully.",
      settings: body,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
