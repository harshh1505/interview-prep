import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

if (
  supabaseUrl &&
  supabaseServiceRoleKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("your-project")
) {
  try {
    client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Supabase init warning:", err);
  }
}

// Fallback proxy or null-safe export
export const supabase = client as unknown as SupabaseClient;
export const isSupabaseConfigured = Boolean(client);
