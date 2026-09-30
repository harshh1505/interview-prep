import { NextRequest, NextResponse } from "next/server";
import { MOCK_AUTH_COOKIE, MockUser } from "@/lib/mock-auth";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(MOCK_AUTH_COOKIE)?.value;
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = JSON.parse(decodeURIComponent(cookie)) as MockUser;
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user: MockUser = body.user;

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: "Invalid user session data" },
        { status: 400 }
      );
    }

    // Ensure profile exists in storage
    try {
      await storage.upsertProfile(user.id, {
        full_name: user.full_name || user.user_metadata?.full_name,
        target_role: user.target_role || user.user_metadata?.target_role,
      });
    } catch (e) {
      console.warn("Could not upsert mock profile in storage:", e);
    }

    const jsonStr = JSON.stringify(user);
    const encoded = encodeURIComponent(jsonStr);

    const response = NextResponse.json({ ok: true, user });

    // Set cookie on the server response
    response.cookies.set({
      name: MOCK_AUTH_COOKIE,
      value: encoded,
      httpOnly: false, // allow client-side reading as well
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Mock session POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MOCK_AUTH_COOKIE);
  return response;
}
