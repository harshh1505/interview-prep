"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  SHOWCASE_USERS,
  setClientMockSession,
  authenticateMockAccount,
  MockUser,
} from "@/lib/mock-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [activeTab, setActiveTab] = useState<"instant" | "custom">("instant");
  const [email, setEmail] = useState("harsh@rehearsal.ai");
  const [password, setPassword] = useState("showcase2026");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quick 1-click persona login
  async function handlePersonaLogin(personaKey: "harsh" | "candidate") {
    setLoadingPersona(personaKey);
    setError(null);
    setSuccessMsg(`Signing in as ${SHOWCASE_USERS[personaKey].full_name}…`);

    try {
      const user = SHOWCASE_USERS[personaKey];
      await setClientMockSession(user);

      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 600);
    } catch (err: any) {
      console.error("Persona login error:", err);
      setError("Failed to sign in. Please try again.");
      setLoadingPersona(null);
      setSuccessMsg(null);
    }
  }

  // Custom credentials login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isDemoMode) {
      // Validate credentials against registered mock accounts
      const authResult = authenticateMockAccount(email, password);
      if (!authResult.success) {
        setError(authResult.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      setSuccessMsg(`Welcome, ${authResult.user!.full_name}! Launching workspace…`);
      await setClientMockSession(authResult.user!);

      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 700);
      return;
    }

    // Standard Supabase login attempt
    try {
      const supabase = createSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`${authError.message}. Tip: Toggle "Instant Showcase Mode" above to log in without Supabase.`);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError("Network or authentication error. Switch to Showcase Mode for guaranteed instant access.");
      setLoading(false);
    }
  }

  function handleAutofill(persona: "harsh" | "candidate") {
    const user = SHOWCASE_USERS[persona];
    setEmail(user.email);
    setPassword("showcase2026");
    setIsDemoMode(true);
    setError(null);
  }

  return (
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
          {/* Top Live Badge */}
          <div className="flex items-center justify-center mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-sans text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Showcase Demo Ready</span>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-chalk-50 text-center mb-1.5">
            Welcome to Rehearsal
          </h1>
          <p className="font-sans text-xs sm:text-sm text-chalk-200/60 text-center mb-6">
            Sign in to experience AI-powered technical interview coaching
          </p>

          {/* Feedback messages */}
          {error && (
            <div className="mb-5 rounded-lg border border-clay-500/40 bg-clay-500/15 px-4 py-3 text-xs sm:text-sm font-sans text-clay-400">
              <div className="flex items-start justify-between gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setIsDemoMode(true)}
                  className="underline text-amber-400 hover:text-amber-300 font-medium shrink-0"
                >
                  Use Demo Mode
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-lg border border-moss-500/40 bg-moss-500/15 px-4 py-3 text-xs sm:text-sm font-sans text-moss-400 flex items-center gap-2 animate-pulse">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-950/70 p-1 border border-chalk-200/10 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("instant")}
              className={`rounded-md py-2 px-3 text-xs font-sans font-medium transition ${
                activeTab === "instant"
                  ? "bg-amber-500 text-ink-950 shadow font-semibold"
                  : "text-chalk-200/60 hover:text-chalk-100"
              }`}
            >
              ⚡ 1-Click Showcase
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`rounded-md py-2 px-3 text-xs font-sans font-medium transition ${
                activeTab === "custom"
                  ? "bg-amber-500 text-ink-950 shadow font-semibold"
                  : "text-chalk-200/60 hover:text-chalk-100"
              }`}
            >
              Custom Sign In
            </button>
          </div>

          {/* Tab 1: Instant Showcase Personas */}
          {activeTab === "instant" && (
            <div className="space-y-3.5">
              {/* Persona 1: Harsh Singh (Full Showcase with sessions & resume) */}
              <button
                type="button"
                id="login-persona-harsh"
                onClick={() => handlePersonaLogin("harsh")}
                disabled={Boolean(loadingPersona)}
                className="w-full text-left rounded-xl border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 p-4 transition group focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-serif font-bold text-amber-400 border border-amber-500/40">
                      H
                    </span>
                    <div>
                      <span className="font-serif text-sm font-semibold text-chalk-50 group-hover:text-amber-400 transition">
                        Harsh Singh
                      </span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-sans text-amber-300 border border-amber-500/30">
                        Full Showcase
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 group-hover:translate-x-0.5 transition font-semibold">
                    {loadingPersona === "harsh" ? "Entering…" : "Launch →"}
                  </span>
                </div>
                <p className="font-sans text-xs text-chalk-200/70 pl-9">
                  Includes indexed resume, evaluated questions, AI weakness radar & historical analytics.
                </p>
              </button>

              {/* Persona 2: Alex Rivera (Fresh Workspace) */}
              <button
                type="button"
                id="login-persona-candidate"
                onClick={() => handlePersonaLogin("candidate")}
                disabled={Boolean(loadingPersona)}
                className="w-full text-left rounded-xl border border-chalk-200/15 bg-ink-800/50 hover:bg-ink-800/80 p-4 transition group focus:outline-none focus:ring-2 focus:ring-chalk-200/20"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-chalk-200/10 text-xs font-serif font-bold text-chalk-100 border border-chalk-200/20">
                      A
                    </span>
                    <div>
                      <span className="font-serif text-sm font-semibold text-chalk-50 group-hover:text-amber-400 transition">
                        Alex Rivera
                      </span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-chalk-200/10 px-2 py-0.5 text-[10px] font-sans text-chalk-200/60 border border-chalk-200/15">
                        Fresh Candidate
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-chalk-200/60 group-hover:text-chalk-50 group-hover:translate-x-0.5 transition">
                    {loadingPersona === "candidate" ? "Entering…" : "Launch →"}
                  </span>
                </div>
                <p className="font-sans text-xs text-chalk-200/60 pl-9">
                  Clean slate. Best for testing PDF resume upload and tailored question generation from scratch.
                </p>
              </button>
            </div>
          )}

          {/* Tab 2: Custom Credentials Form */}
          {activeTab === "custom" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-email"
                    className="block font-sans text-xs text-chalk-200/70 uppercase tracking-wider"
                  >
                    Email
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAutofill("harsh")}
                    className="text-[11px] font-sans text-amber-400/80 hover:text-amber-300 transition"
                  >
                    Auto-fill demo
                  </button>
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@rehearsal.ai"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
                <p className="mt-1 text-[11px] font-sans text-chalk-200/40">
                  Demo password: <span className="font-mono text-amber-400">showcase2026</span>
                </p>
              </div>

              {/* Instant Showcase Mode Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                <div className="pr-2">
                  <span className="block font-sans text-xs font-medium text-amber-300">
                    Instant Showcase Mode
                  </span>
                  <span className="block font-sans text-[11px] text-chalk-200/50">
                    Guaranteed instant entry (bypasses remote auth verification)
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
                id="login-submit"
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-lg border border-amber-500 bg-amber-500 py-2.5 font-sans text-sm font-semibold text-ink-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-ink-950/40 border-t-ink-950 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In →"
                )}
              </button>
            </form>
          )}

          {/* Footer link to Signup */}
          <div className="mt-6 border-t border-chalk-200/10 pt-5 text-center">
            <p className="font-sans text-xs sm:text-sm text-chalk-200/60">
              Need to test new candidate onboarding?{" "}
              <Link
                href="/signup"
                className="text-amber-400 hover:text-amber-300 transition font-medium underline underline-offset-4"
              >
                Instant Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-chalk-200/10 bg-ink-900/80 p-8 shadow-2xl animate-pulse">
          <div className="h-6 w-36 mx-auto rounded-full bg-ink-800 mb-6" />
          <div className="h-8 w-48 mx-auto rounded bg-ink-800 mb-3" />
          <div className="h-4 w-64 mx-auto rounded bg-ink-800 mb-8" />
          <div className="space-y-4">
            <div className="h-16 rounded-xl bg-ink-800" />
            <div className="h-16 rounded-xl bg-ink-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
              href="/signup"
              className="text-chalk-200/70 hover:text-chalk-50 transition"
            >
              Sign Up
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

      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
