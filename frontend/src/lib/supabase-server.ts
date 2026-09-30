import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MOCK_AUTH_COOKIE, MockUser } from "./mock-auth";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const mockCookie = cookieStore.get(MOCK_AUTH_COOKIE)?.value;
  let mockUser: MockUser | null = null;
  if (mockCookie) {
    try {
      mockUser = JSON.parse(decodeURIComponent(mockCookie));
    } catch {
      try {
        mockUser = JSON.parse(mockCookie);
      } catch {}
    }
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — can be ignored
          }
        },
      },
    }
  );

  if (mockUser && mockUser.id) {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async () => {
      try {
        const res = await originalGetUser();
        if (res.data?.user) return res;
      } catch {}

      return {
        data: {
          user: {
            id: mockUser!.id,
            email: mockUser!.email,
            user_metadata: mockUser!.user_metadata || {
              full_name: mockUser!.full_name,
              target_role: mockUser!.target_role,
            },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
        error: null,
      };
    };
  }

  return client;
}
