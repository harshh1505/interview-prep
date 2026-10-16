import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase-server";
import { getSupabaseAdminClient } from "./admin-auth";
import { safeParseMockUser, MockUser } from "./mock-auth";

export const SESSION_COOKIE_NAME = "cc_session";

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  targetRole: string;
  role: "user" | "admin";
}

/**
 * Extracts and verifies the authenticated user from HTTP request cookies or Supabase Auth.
 * Queries Supabase PostgreSQL public.profiles table as single source of truth.
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies();

    // 1. Try reading custom session cookie cc_session
    const ccCookie = req
      ? req.cookies.get(SESSION_COOKIE_NAME)?.value
      : cookieStore.get(SESSION_COOKIE_NAME)?.value;

    let parsedFromCookie: MockUser | null = safeParseMockUser(ccCookie);

    // 2. Try reading fallback mock_user_session cookie if cc_session not present
    if (!parsedFromCookie) {
      const mockCookie = req
        ? req.cookies.get("mock_user_session")?.value
        : cookieStore.get("mock_user_session")?.value;
      parsedFromCookie = safeParseMockUser(mockCookie);
    }

    let targetUserId = parsedFromCookie?.id || null;
    let fallbackEmail = parsedFromCookie?.email || "";

    // 3. Try reading Supabase Auth SSR session
    if (!targetUserId) {
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.id) {
          targetUserId = user.id;
          fallbackEmail = user.email || "";
        }
      } catch (err) {
        // Supabase SSR client read failure ignored
      }
    }

    if (!targetUserId) {
      return null;
    }

    // 4. Fetch authoritative user profile from Supabase PostgreSQL public.profiles table
    const adminDb = getSupabaseAdminClient();
    if (adminDb) {
      const { data: profile } = await adminDb
        .from("profiles")
        .select("id, full_name, target_role, role, created_at")
        .eq("id", targetUserId)
        .single();

      if (profile) {
        const resolvedName =
          (profile.full_name && profile.full_name !== "Candidate" ? profile.full_name : null) ||
          parsedFromCookie?.full_name ||
          parsedFromCookie?.user_metadata?.full_name ||
          (parsedFromCookie as any)?.fullName ||
          profile.full_name ||
          "Candidate";

        const resolvedTargetRole =
          profile.target_role ||
          parsedFromCookie?.target_role ||
          parsedFromCookie?.user_metadata?.target_role ||
          "Software Engineer";

        return {
          id: profile.id,
          email: fallbackEmail || `${profile.id.substring(0, 8)}@preppilot.ai`,
          fullName: resolvedName,
          targetRole: resolvedTargetRole,
          role: profile.role === "admin" ? "admin" : "user",
        };
      }
    }

    // 5. If profile parsed from cookie has valid ID and attributes
    if (parsedFromCookie && parsedFromCookie.id) {
      const resolvedName =
        parsedFromCookie.full_name ||
        parsedFromCookie.user_metadata?.full_name ||
        (parsedFromCookie as any).fullName ||
        (parsedFromCookie as any).name ||
        "Candidate";

      return {
        id: parsedFromCookie.id,
        email: parsedFromCookie.email || "user@example.com",
        fullName: resolvedName,
        targetRole: parsedFromCookie.target_role || parsedFromCookie.user_metadata?.target_role || "Software Engineer",
        role: parsedFromCookie.role === "admin" ? "admin" : "user",
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}
