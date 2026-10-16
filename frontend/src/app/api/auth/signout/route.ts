import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { MOCK_AUTH_COOKIE } from "@/lib/mock-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  // Delete all authentication cookies across all domains and paths
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: MOCK_AUTH_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, { ...options, maxAge: 0 })
            );
          },
        },
      }
    );

    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase auth.signOut warning:", err);
  }

  return response;
}
