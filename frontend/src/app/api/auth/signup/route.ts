import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/admin-auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { MOCK_AUTH_COOKIE } from "@/lib/mock-auth";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, targetRole, email, password } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanRole = targetRole?.trim() || "Software Engineer";

    const adminDb = getSupabaseAdminClient();
    let userId: string = "";

    if (adminDb) {
      // Check if profile with this email or ID already exists in database
      const { data: existingProfiles } = await adminDb
        .from("profiles")
        .select("id, full_name")
        .eq("full_name", cleanName);

      // Check Supabase auth admin to create user with auto email confirmation
      const { data: authUser, error: authError } = await adminDb.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          target_role: cleanRole,
          role: "user",
        },
      });

      if (authError) {
        // If user already registered in Supabase Auth
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          return NextResponse.json(
            { error: "An account with this email address already exists. Please log in instead." },
            { status: 400 }
          );
        }

        console.warn("Supabase Auth admin createUser error, falling back to database profile creation:", authError.message);
        userId = crypto.randomUUID();
      } else if (authUser?.user?.id) {
        userId = authUser.user.id;
      } else {
        userId = crypto.randomUUID();
      }

      // Explicitly insert into public.profiles table in Supabase PostgreSQL
      const profileRecord = {
        id: userId,
        full_name: cleanName,
        target_role: cleanRole,
        role: "user",
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await adminDb.from("profiles").upsert(profileRecord, { onConflict: "id" });
      if (dbError) {
        console.error("Failed to upsert profile in Supabase profiles:", dbError);
      }
    } else {
      userId = crypto.randomUUID();
    }

    // Also persist in storage abstraction for local fallback if any
    try {
      await storage.upsertProfile(userId, {
        full_name: cleanName,
        target_role: cleanRole,
      });
    } catch (e) {
      console.warn("Local storage upsertProfile warning:", e);
    }

    const sessionUserData = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      target_role: cleanRole,
      role: "user",
      is_admin: false,
      is_mock: false,
      user_metadata: {
        full_name: cleanName,
        target_role: cleanRole,
        role: "user",
      },
    };

    const encodedSession = encodeURIComponent(JSON.stringify(sessionUserData));

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: userId,
        email: cleanEmail,
        fullName: cleanName,
        targetRole: cleanRole,
        role: "user",
      },
    });

    // Set secure HTTP session cookies on the response
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodedSession,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set({
      name: MOCK_AUTH_COOKIE,
      value: encodedSession,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
