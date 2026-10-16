import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { safeParseMockUser } from "@/lib/mock-auth";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // 1. Check for mock showcase session cookie first
  const mockCookie = request.cookies.get("mock_user_session")?.value;
  const mockUser = safeParseMockUser(mockCookie);

  let realUser: { id: string; email?: string } | null = null;
  let supabaseClient: any = null;

  // Initialize Supabase Server Client
  try {
    supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    realUser = user;
  } catch {
    // Supabase unreachable or unconfigured
  }

  // Effective user for normal user routes
  const effectiveUser = mockUser && mockUser.id ? mockUser : realUser;

  // ------------------------------------------------------------
  // ADMIN ROUTE PROTECTION (/admin/*)
  // ------------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    const isAdminLogin = pathname === "/admin/login";

    if (isAdminLogin) {
      // If real authenticated admin user visits /admin/login, redirect to /admin/dashboard
      if (realUser && !mockUser) {
        try {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", realUser.id)
            .single();

          if (profile?.role === "admin") {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/admin/dashboard";
            return NextResponse.redirect(redirectUrl);
          }
        } catch {}
      }
      return supabaseResponse;
    }

    // Protect all other /admin/* routes
    // Rule 46: Mock accounts are strictly prohibited from accessing admin portal
    if (mockUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set(
        "error",
        "Mock demo accounts do not have administrator permissions. Please log in with an administrator account."
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!realUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Verify role === 'admin' from Supabase database
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", realUser.id)
        .single();

      if (!profile || profile.role !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin/login";
        redirectUrl.searchParams.set(
          "error",
          "You are not authorized to access the admin portal."
        );
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("error", "Database authorization error.");
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  }

  // ------------------------------------------------------------
  // USER PROTECTED ROUTES (/dashboard, /upload, /interview)
  // ------------------------------------------------------------
  const protectedRoutes = ["/dashboard", "/upload", "/interview"];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !effectiveUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
