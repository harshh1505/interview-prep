"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { setClientMockSession, registerMockAccount, MockUser } from "@/lib/mock-auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Engineer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleAutofill() {
    setFullName("Harsh Singh");
    setTargetRole("Full-Stack & Generative AI Engineer");
    setEmail("harsh.demo@rehearsal.ai");
    setPassword("showcase2026");
    setIsDemoMode(true);
    setError(null);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      // Register new account with password validation
      const regResult = registerMockAccount({
        email,
        password,
        full_name: fullName,
        target_role: targetRole,
      });

      if (!regResult.success) {
        setError(regResult.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      setSuccessMsg(`Account created for ${regResult.user!.full_name}! Preparing your workspace…`);

      try {
        await setClientMockSession(regResult.user!);

        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 800);
      } catch (err: any) {
        console.error("Mock signup error:", err);
        setError("Failed to create mock session. Please try again.");
        setLoading(false);
        setSuccessMsg(null);
      }
      return;
    }

    // Standard Supabase Signup
    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, target_role: targetRole },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/api/auth/callback`
              : undefined,
        },
      });

      if (authError) {
        setError(`${authError.message}. Tip: Turn on "Instant Showcase Mode" to bypass email verification.`);
        setLoading(false);
        return;
      }

      // If email confirmation is disabled in Supabase, session is returned immediately
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Otherwise, show confirmation message with option to skip
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError("Network or authentication error. Use Instant Showcase Mode for immediate access.");
      setLoading(false);
    }
  }

  // Fallback screen if real Supabase requires email confirmation
  if (success) {
    return (
      <main className="min-h-screen bg-ink-950 text-chalk-100 flex flex-col">
        <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-500 transition"
            >
              Rehearsal
            </Link>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <div className="rounded-2xl border border-moss-500/30 bg-moss-500/10 p-8 shadow-2xl">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-moss-500/20 border border-moss-500/40 flex items-center justify-center text-2xl text-moss-400">
                  ✓
                </div>
              </div>
              <h1 className="font-serif text-2xl text-chalk-50 mb-2">
                Confirmation Link Sent
              </h1>
              <p className="font-sans text-sm text-chalk-200/70 leading-relaxed mb-6">
                We sent a verification link to{" "}
                <span className="text-amber-400 font-medium">{email}</span>.
              </p>

              {/* Showcase skip option */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 text-left">
                <p className="font-sans text-xs text-amber-300 font-medium mb-1">
                  ⚡ Demonstrating or Showcasing Rehearsal?
                </p>
                <p className="font-sans text-[11px] text-chalk-200/70 mb-3">
                  Skip the inbox and enter your workspace directly with this candidate profile.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const mockUser: MockUser = {
                      id: "user-" + Math.random().toString(36).substring(2, 10),
                      email,
                      full_name: fullName || "Candidate",
                      target_role: targetRole,
                      is_mock: true,
                    };
                    await setClientMockSession(mockUser);
                    router.push("/dashboard");
                    router.refresh();
                  }}
                  className="w-full rounded-lg bg-amber-500 py-2 text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
                >
                  Enter Workspace Instantly →
                </button>
              </div>

              <Link
                href="/login"
                className="font-sans text-xs text-chalk-200/60 hover:text-chalk-100 transition"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-400 transition flex items-center gap-2"
          >
            <span>Rehearsal</span>
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 uppercase tracking-wider">
              Showcase
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-sans">
            <Link
              href="/login"
              className="text-chalk-200/70 hover:text-chalk-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="text-chalk-200/50 hover:text-chalk-200/80 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Signup Card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div
          className={`w-full max-w-md transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative rounded-2xl border border-chalk-200/15 bg-ink-900/90 backdrop-blur-md p-7 sm:p-8 shadow-2xl">
            {/* Top badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-sans text-amber-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Showcase Registration</span>
              </div>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-[11px] font-sans text-amber-400 hover:text-amber-300 transition underline underline-offset-2"
              >
                ✨ Autofill sample
              </button>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-chalk-50 text-center mb-1.5">
              Start Practicing Today
            </h1>
            <p className="font-sans text-xs sm:text-sm text-chalk-200/60 text-center mb-6">
              Create your candidate profile to test tailored question generation
            </p>

            {error && (
              <div className="mb-5 rounded-lg border border-clay-500/40 bg-clay-500/15 px-4 py-3 text-xs sm:text-sm font-sans text-clay-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 rounded-lg border border-moss-500/40 bg-moss-500/15 px-4 py-3 text-xs sm:text-sm font-sans text-moss-400 flex items-center gap-2 animate-pulse">
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Harsh Singh"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-role"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Target Role / Domain
                </label>
                <input
                  id="signup-role"
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer, AI/ML Specialist"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              {/* Instant Showcase Mode Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                <div className="pr-2">
                  <span className="block font-sans text-xs font-medium text-amber-300">
                    Instant Showcase Mode
                  </span>
                  <span className="block font-sans text-[11px] text-chalk-200/50">
                    Bypasses email verification for instant presentation
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={(e) => setIsDemoMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-ink-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-chalk-100 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-lg border border-amber-500 bg-amber-500 py-2.5 font-sans text-sm font-semibold text-ink-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-ink-950/40 border-t-ink-950 animate-spin" />
                    Creating Candidate Workspace…
                  </>
                ) : (
                  "Create Account & Enter Workspace →"
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-chalk-200/10 pt-5 text-center">
              <p className="font-sans text-xs sm:text-sm text-chalk-200/60">
                Already have an account or demo persona?{" "}
                <Link
                  href="/login"
                  className="text-amber-400 hover:text-amber-300 transition font-medium underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
