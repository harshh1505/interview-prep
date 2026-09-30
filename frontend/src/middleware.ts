import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // 1. Check for mock showcase session cookie first
  const mockCookie = request.cookies.get("mock_user_session")?.value;
  let mockUser: { id: string; email?: string } | null = null;
  if (mockCookie) {
    try {
      mockUser = JSON.parse(decodeURIComponent(mockCookie));
    } catch {
      try {
        mockUser = JSON.parse(mockCookie);
      } catch {}
    }
  }

  // If mock user exists, bypass slow Supabase remote network call entirely!
  let effectiveUser = mockUser && mockUser.id ? mockUser : null;

  // 2. Only query Supabase if there is NO mock user
  if (!effectiveUser) {
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
      } = await supabase.auth.getUser();
      effectiveUser = user;
    } catch {
      // Supabase unreachable or misconfigured
    }
  }

  const { pathname } = request.nextUrl;

  // Protected routes: require authentication
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

  // If logged in and visiting auth pages, redirect to dashboard unless switch=true
  const allowSwitch = request.nextUrl.searchParams.get("switch") === "true";
  if (effectiveUser && !allowSwitch && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
