import { createBrowserClient } from "@supabase/ssr";
import { getClientMockSession, clearClientMockSession } from "./mock-auth";

export function createSupabaseClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (typeof window !== "undefined") {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    const originalGetSession = client.auth.getSession.bind(client.auth);
    const originalSignOut = client.auth.signOut.bind(client.auth);

    
    client.auth.getUser = async () => {
      // 1. Instant check for mock session: return immediately without remote fetch
      const mockUser = getClientMockSession();
      if (mockUser) {
        return {
          data: {
            user: {
              id: mockUser.id,
              email: mockUser.email,
              user_metadata: mockUser.user_metadata || {
                full_name: mockUser.full_name,
                target_role: mockUser.target_role,
              },
              app_metadata: { is_mock: true },
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
          error: null,
        };
      }

      // 2. Otherwise try Supabase
      try {
        return await originalGetUser();
      } catch (e) {
        return { data: { user: null }, error: e as any };
      }
    };

    client.auth.getSession = async () => {
      // 1. Instant check for mock session
      const mockUser = getClientMockSession();
      if (mockUser) {
        const fakeUser = {
          id: mockUser.id,
          email: mockUser.email,
          user_metadata: mockUser.user_metadata || {
            full_name: mockUser.full_name,
            target_role: mockUser.target_role,
          },
          app_metadata: { is_mock: true },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        return {
          data: {
            session: {
              access_token: "mock-access-token",
              token_type: "bearer",
              expires_in: 3600,
              refresh_token: "mock-refresh-token",
              user: fakeUser,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
          error: null,
        };
      }

      // 2. Otherwise try Supabase
      try {
        return await originalGetSession();
      } catch (e) {
        return { data: { session: null }, error: e as any };
      }
    };

    client.auth.signOut = async (options) => {
      await clearClientMockSession();
      try {
        return await originalSignOut(options);
      } catch {
        return { error: null };
      }
    };
  }

  return client;
}
