"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createSupabaseClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled in Supabase, session is returned immediately
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Otherwise, show confirmation message
    setSuccess(true);
    setLoading(false);
  }

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
          <div className="w-full max-w-sm text-center">
            <div className="rounded-xl border border-moss-500/30 bg-moss-500/10 p-8">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-moss-500/20 border border-moss-500/40 flex items-center justify-center text-2xl">
                  ✓
                </div>
              </div>
              <h1 className="font-serif text-2xl text-chalk-50 mb-2">
                Check your email
              </h1>
              <p className="font-sans text-sm text-chalk-200/70 leading-relaxed">
                We&apos;ve sent a confirmation link to{" "}
                <span className="text-amber-400">{email}</span>. Click the link
                to activate your account and start practising.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block font-sans text-sm text-amber-400 hover:text-amber-300 transition"
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
            className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-500 transition"
          >
            Rehearsal
          </Link>
          <span className="font-sans text-xs text-chalk-200/50">
            AI Interview Practice
          </span>
        </div>
      </header>

      {/* Signup Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div
          className={`w-full max-w-sm transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="relative rounded-xl border border-chalk-200/10 bg-ink-900/80 backdrop-blur-sm p-8 shadow-2xl">
            {/* Top badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-sans text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Create your account
              </div>
            </div>

            <h1 className="font-serif text-2xl text-chalk-50 text-center mb-1">
              Start practising today
            </h1>
            <p className="font-sans text-sm text-chalk-200/60 text-center mb-8">
              Track your progress across every mock interview
            </p>

            {error && (
              <div className="mb-5 rounded-lg border border-clay-500/40 bg-clay-500/10 px-4 py-3 text-sm font-sans text-clay-400">
                {error}
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
                  placeholder="Harsh Singh"
                  className="w-full rounded-lg border border-chalk-200/15 bg-ink-800 px-4 py-2.5 font-sans text-sm text-chalk-100 placeholder:text-chalk-200/30 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block font-sans text-xs text-chalk-200/70 mb-1.5 uppercase tracking-wider"
                >
                  Email
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

              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-amber-500 bg-amber-500 py-2.5 font-sans text-sm font-semibold text-ink-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-ink-950/40 border-t-ink-950 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-chalk-200/10 pt-6 text-center">
              <p className="font-sans text-sm text-chalk-200/60">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-amber-400 hover:text-amber-300 transition font-medium"
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
