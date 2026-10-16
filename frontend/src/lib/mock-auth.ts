export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  target_role?: string;
  role?: string;
  is_admin?: boolean;
  is_mock: boolean;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    target_role?: string;
    role?: string;
    is_admin?: boolean;
  };
}

export interface RegisteredAccount {
  id: string;
  email: string;
  password: string;
  full_name: string;
  target_role?: string;
  role?: string;
  is_admin?: boolean;
  created_at: string;
}

export const SHOWCASE_USERS: Record<string, MockUser> = {
  harsh: {
    id: "00000000-0000-0000-0000-000000000000",
    email: "harsh@rehearsal.ai",
    full_name: "Harsh Singh",
    target_role: "Full Stack & AI Engineer",
    role: "user",
    is_admin: false,
    is_mock: true,
    user_metadata: {
      full_name: "Harsh Singh",
      target_role: "Full Stack & AI Engineer",
      role: "user",
      is_admin: false,
    },
  },
  candidate: {
    id: "fresh-candidate-001",
    email: "alex.rivera@example.com",
    full_name: "Alex Rivera",
    target_role: "Frontend Engineer",
    role: "user",
    is_admin: false,
    is_mock: true,
    user_metadata: {
      full_name: "Alex Rivera",
      target_role: "Frontend Engineer",
      role: "user",
      is_admin: false,
    },
  },
  admin: {
    id: "admin-showcase-001",
    email: "admin@rehearsal.ai",
    full_name: "Admin User",
    target_role: "System Administrator",
    role: "admin",
    is_admin: true,
    is_mock: true,
    user_metadata: {
      full_name: "Admin User",
      target_role: "System Administrator",
      role: "admin",
      is_admin: true,
    },
  },
};

const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "harsh@rehearsal.ai",
    password: "showcase2026",
    full_name: "Harsh Singh",
    target_role: "Full Stack & AI Engineer",
    role: "user",
    is_admin: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "demo@rehearsal.ai",
    password: "showcase2026",
    full_name: "Demo Candidate",
    target_role: "Full Stack Engineer",
    role: "user",
    is_admin: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "fresh-candidate-001",
    email: "alex.rivera@example.com",
    password: "showcase2026",
    full_name: "Alex Rivera",
    target_role: "Frontend Engineer",
    role: "user",
    is_admin: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "admin-showcase-001",
    email: "admin@rehearsal.ai",
    password: "showcase2026",
    full_name: "Admin User",
    target_role: "System Administrator",
    role: "admin",
    is_admin: true,
    created_at: new Date().toISOString(),
  },
];

export const MOCK_AUTH_COOKIE = "mock_user_session";
export const MOCK_ACCOUNTS_KEY = "rehearsal_mock_accounts";

/**
 * Get all registered mock accounts from localStorage.
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;

  try {
    const raw = localStorage.getItem(MOCK_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RegisteredAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load mock accounts:", err);
  }

  // Seed default accounts
  try {
    localStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } catch {}

  return DEFAULT_ACCOUNTS;
}

/**
 * Register a new mock account with credentials validation.
 */
export function registerMockAccount(data: {
  email: string;
  password: string;
  full_name: string;
  target_role?: string;
  role?: string;
  is_admin?: boolean;
}): { success: boolean; user?: MockUser; error?: string } {
  const emailClean = data.email.trim().toLowerCase();
  const passwordClean = data.password;

  if (!emailClean || !emailClean.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!passwordClean || passwordClean.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === emailClean);

  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  const id = "user-" + Math.random().toString(36).substring(2, 10);
  const isAdmin = Boolean(data.is_admin || data.role === "admin" || emailClean.startsWith("admin@"));
  const role = data.role || (isAdmin ? "admin" : "user");

  const newAccount: RegisteredAccount = {
    id,
    email: emailClean,
    password: passwordClean,
    full_name: data.full_name.trim() || (isAdmin ? "Admin User" : "Candidate"),
    target_role: data.target_role?.trim() || (isAdmin ? "System Administrator" : "Software Engineer"),
    role,
    is_admin: isAdmin,
    created_at: new Date().toISOString(),
  };

  const updated = [...accounts, newAccount];
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to save registered account to localStorage:", err);
  }

  const user: MockUser = {
    id: newAccount.id,
    email: newAccount.email,
    full_name: newAccount.full_name,
    target_role: newAccount.target_role,
    role: newAccount.role,
    is_admin: newAccount.is_admin,
    is_mock: true,
    user_metadata: {
      full_name: newAccount.full_name,
      target_role: newAccount.target_role,
      role: newAccount.role,
      is_admin: newAccount.is_admin,
    },
  };

  return { success: true, user };
}

/**
 * Authenticate with email & password against stored mock accounts.
 */
export function authenticateMockAccount(
  email: string,
  password: string
): { success: boolean; user?: MockUser; error?: string } {
  const emailClean = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();

  const found = accounts.find((a) => a.email.toLowerCase() === emailClean);

  if (!found) {
    return {
      success: false,
      error: `No account found with "${emailClean}". Please sign up first or check your spelling.`,
    };
  }

  if (found.password !== password) {
    return {
      success: false,
      error: `Incorrect password for ${emailClean}. (Default demo password is "showcase2026")`,
    };
  }

  const isAdmin = Boolean(found.is_admin || found.role === "admin" || emailClean.startsWith("admin@"));
  const role = found.role || (isAdmin ? "admin" : "user");

  const user: MockUser = {
    id: found.id,
    email: found.email,
    full_name: found.full_name,
    target_role: found.target_role,
    role,
    is_admin: isAdmin,
    is_mock: true,
    user_metadata: {
      full_name: found.full_name,
      target_role: found.target_role,
      role,
      is_admin: isAdmin,
    },
  };

  return { success: true, user };
}

/**
 * Safely decodes and parses mock session JSON from cookie or localStorage strings.
 * Correctly decodes single or multi-level URL encoding (e.g. %7B%22... or %257B%22...)
 * without throwing SyntaxError: Unexpected token '%'.
 */
export function safeParseMockUser(rawValue: string | null | undefined): MockUser | null {
  if (!rawValue) return null;
  let str = String(rawValue).trim();
  if (!str) return null;

  // Strip wrapping quotes if any
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }

  // Iteratively decode URL encoding (up to 3 times) until it starts with '{' or no more '%'
  for (let i = 0; i < 3; i++) {
    if (str.startsWith("{")) {
      break;
    }
    if (str.includes("%")) {
      try {
        const decoded = decodeURIComponent(str);
        if (decoded === str) break;
        str = decoded.trim();
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
      return parsed as MockUser;
    }
  } catch {
    // If direct parse failed, attempt one final decodeURIComponent
    if (str.includes("%")) {
      try {
        const decoded = decodeURIComponent(str);
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
          return parsed as MockUser;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Read the current mock session from document.cookie or localStorage (client-side only).
 */
export function getClientMockSession(): MockUser | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Check cookies first
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${MOCK_AUTH_COOKIE}=`));

    if (match) {
      const rawVal = match.substring(MOCK_AUTH_COOKIE.length + 1);
      const user = safeParseMockUser(rawVal);
      if (user) return user;
    }

    // 2. Fallback to localStorage
    const local = localStorage.getItem(MOCK_AUTH_COOKIE);
    if (local) {
      const user = safeParseMockUser(local);
      if (user) return user;
    }
  } catch (e) {
    console.warn("Failed to parse client mock session:", e);
  }

  return null;
}

/**
 * Persist the mock session both in document.cookie, localStorage, and via server sync API.
 */
export async function setClientMockSession(user: MockUser): Promise<void> {
  if (typeof window === "undefined") return;

  const jsonStr = JSON.stringify(user);
  const encoded = encodeURIComponent(jsonStr);

  // Set browser cookie (1 week expiry)
  document.cookie = `${MOCK_AUTH_COOKIE}=${encoded}; path=/; max-age=604800; SameSite=Lax`;

  try {
    localStorage.setItem(MOCK_AUTH_COOKIE, jsonStr);
  } catch {}

  // Sync to server via API route so Next.js HTTP cookie is set reliably for SSR
  try {
    await fetch("/api/auth/mock-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
  } catch (err) {
    console.warn("Server cookie sync failed, client cookie used:", err);
  }
}

/**
 * Remove the mock session from cookies, localStorage, and server API.
 */
export async function clearClientMockSession(): Promise<void> {
  if (typeof window === "undefined") return;

  document.cookie = `${MOCK_AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

  try {
    localStorage.removeItem(MOCK_AUTH_COOKIE);
  } catch {}

  try {
    await fetch("/api/auth/mock-session", { method: "DELETE" });
  } catch (err) {
    console.warn("Server cookie clear failed:", err);
  }
}
