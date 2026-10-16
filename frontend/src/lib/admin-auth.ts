import { createSupabaseServerClient } from "./supabase-server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { MOCK_AUTH_COOKIE } from "./mock-auth";

export interface AdminAuthResult {
  authorized: boolean;
  statusCode: number;
  error?: string;
  user?: {
    id: string;
    email?: string;
  };
  profile?: {
    id: string;
    full_name?: string;
    role: string;
    created_at?: string;
  };
}

/**
 * Creates a server-side Supabase client initialized with the SUPABASE_SERVICE_ROLE_KEY.
 * MUST ONLY be called server-side (in Next.js Route Handlers / Server Actions).
 */
export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || !url.startsWith("http")) {
    return null;
  }

  try {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.warn("Failed to initialize Supabase Admin Client:", err);
    return null;
  }
}

/**
 * Ensures that a corresponding row exists in public.profiles for an authenticated user.
 */
export async function ensureUserProfile(user: {
  id: string;
  email?: string;
  user_metadata?: any;
}) {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return null;

  try {
    // 1. Try fetching profile
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id, full_name, target_role, role, created_at")
      .eq("id", user.id)
      .single();

    if (existing) return existing;

    // 2. If missing, auto-create profile row
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";

    const targetRole = user.user_metadata?.target_role || "General Candidate";
    const requestedRole = user.user_metadata?.role || "user";

    const newProfile = {
      id: user.id,
      full_name: fullName,
      target_role: targetRole,
      role: requestedRole === "admin" ? "admin" : "user",
      created_at: new Date().toISOString(),
    };

    const { data: inserted } = await adminClient
      .from("profiles")
      .insert(newProfile)
      .select()
      .single();

    return inserted || newProfile;
  } catch (err) {
    console.warn("ensureUserProfile warning:", err);
    return null;
  }
}

/**
 * Verifies server-side that the request originates from a real authenticated user
 * whose database profile has role === 'admin'.
 * 
 * IMPORTANT: Mock showcase sessions CANNOT pass this check (security section 46).
 */
export async function requireAdminUser(): Promise<AdminAuthResult> {
  // Check if mock user session cookie exists
  const cookieStore = await cookies();
  const mockCookie = cookieStore.get(MOCK_AUTH_COOKIE)?.value;

  if (mockCookie) {
    // Mock accounts are explicitly denied admin authorization by prompt rule 46
    return {
      authorized: false,
      statusCode: 403,
      error: "Mock demo accounts are not granted admin privileges. Please sign in with a real admin account.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Unauthenticated. Please log in with an administrator account.",
    };
  }

  // Fetch or auto-create profile strictly from the database profiles table
  const adminClient = getSupabaseAdminClient();
  const clientToUse = adminClient || supabase;

  let { data: profile } = await clientToUse
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (!profile && adminClient) {
    profile = await ensureUserProfile(user);
  }

  if (!profile) {
    return {
      authorized: false,
      statusCode: 403,
      error: "User database profile not found or role could not be verified.",
    };
  }

  if (profile.role !== "admin") {
    return {
      authorized: false,
      statusCode: 403,
      error: "Forbidden: You are not authorized to access the admin portal.",
      user: { id: user.id, email: user.email },
      profile,
    };
  }

  return {
    authorized: true,
    statusCode: 200,
    user: { id: user.id, email: user.email },
    profile,
  };
}

/**
 * Log an administrative action to the admin_audit_logs table.
 */
export async function logAdminAuditAction(params: {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) return;

    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log admin audit action:", err);
  }
}
