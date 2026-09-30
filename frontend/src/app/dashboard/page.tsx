"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { getClientMockSession } from "@/lib/mock-auth";
import { listSessions, getSession } from "@/lib/api";
import {
  type EnrichedSession,
  type DashboardStats,
  getStoredDashboardData,
  recordSessionInStorage,
  resetStoredDashboardData,
  computeStatsFromSessions,
} from "@/lib/dashboard-storage";

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#5C7A5A" : score >= 60 ? "#C88A2E" : "#B5563C";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1E2A45" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "amber",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "amber" | "moss" | "clay" | "chalk";
}) {
  const accentClass = {
    amber: "text-amber-400",
    moss: "text-moss-500",
    clay: "text-clay-500",
    chalk: "text-chalk-50",
  }[accent];

  return (
    <div className="rounded-xl border border-chalk-200/10 bg-ink-900 p-5 flex flex-col gap-1 hover:border-chalk-200/20 transition group">
      <span className="font-sans text-[11px] uppercase tracking-widest text-chalk-200/40 group-hover:text-chalk-200/60 transition">
        {label}
      </span>
      <p className={`font-serif text-3xl ${accentClass}`}>{value}</p>
      {sub && (
        <span className="font-sans text-[11px] text-chalk-200/40 mt-0.5">{sub}</span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Initial state (clean initial state until user session resolves)
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [isMock, setIsMock] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync with remote API in the background without blocking the UI
  const syncBackgroundData = useCallback(async (uid: string) => {
    try {
      const { sessions: rawSessions } = await listSessions(uid);
      if (rawSessions && rawSessions.length > 0) {
        for (const s of rawSessions) {
          if (s.status === "completed") {
            try {
              const detail = await getSession(s.id);
              const allAnswers = detail.questions?.flatMap((q) => q.answers || []) || [];
              recordSessionInStorage({ ...s, questions: detail.questions, allAnswers });
            } catch {
              recordSessionInStorage(s);
            }
          } else {
            recordSessionInStorage(s);
          }
        }
        // Refresh local storage view
        const stored = getStoredDashboardData(uid);
        setSessions(stored.sessions);
        setStats(computeStatsFromSessions(stored.sessions));
      }
    } catch (e) {
      console.warn("Background API sync:", e);
    }
  }, []);

  // Hydrate immediately from localStorage for the active user
  useEffect(() => {
    // 1. Check client session
    const mockUser = getClientMockSession();

    if (!mockUser) {
      router.push("/login");
      return;
    }

    const name =
      mockUser.user_metadata?.full_name ||
      mockUser.full_name ||
      mockUser.email?.split("@")[0] ||
      "Candidate";
    setUserName(name);
    setUserId(mockUser.id);
    setIsMock(Boolean(mockUser.is_mock));

    // 2. Load stored data for this specific user from localStorage
    const stored = getStoredDashboardData(mockUser.id);
    setSessions(stored.sessions);
    setStats(computeStatsFromSessions(stored.sessions));
    setLoading(false);

    // 3. Background sync if demo user
    if (mockUser.id === "00000000-0000-0000-0000-000000000000") {
      syncBackgroundData(mockUser.id);
    }
  }, [router, syncBackgroundData]);

  // Handler: Add a quick mock interview session directly to localStorage
  function handleAddMockInterview() {
    const roles = [
      { role: "Senior Distributed Systems Engineer", domain: "Raft, Kafka & Kubernetes", score: 92 },
      { role: "Frontend Performance Specialist", domain: "Core Web Vitals, Next.js & SSR", score: 86 },
      { role: "Staff AI Engineer", domain: "Agentic Workflows & Multi-LLM RAG", score: 95 },
      { role: "Platform Security Engineer", domain: "OAuth 2.1, Zero-Trust & IAM", score: 89 },
    ];
    const picked = roles[Math.floor(Math.random() * roles.length)];

    const newSession: EnrichedSession = {
      id: "session-local-" + Math.random().toString(36).substring(2, 9),
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      role: picked.role,
      domain: picked.domain,
      status: "completed",
      overall_score: picked.score,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      questions: [
        {
          id: "q-dyn-" + Math.random().toString(36).substring(2, 6),
          prompt: `How would you evaluate and optimize performance for ${picked.domain}?`,
          category: "technical",
          order_index: 0,
        },
      ],
      allAnswers: [
        {
          id: "a-dyn-" + Math.random().toString(36).substring(2, 6),
          question_id: "q-dyn-1",
          session_id: "temp",
          answer_text: "Benchmarked latency percentiles (p95, p99), identified bottleneck layers, and implemented horizontal scaling with automated backpressure.",
          score: picked.score,
          strengths: ["Clear metrics-driven approach", "System architecture depth"],
          weaknesses: [],
        },
      ],
    };

    const updatedData = recordSessionInStorage(newSession);
    setSessions(updatedData.sessions);
    setStats(computeStatsFromSessions(updatedData.sessions));

    setToastMsg(`+1 Interview Added: "${picked.role}" (Score: ${picked.score}%) saved to localStorage!`);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Handler: Reset localStorage to default showcase data
  function handleResetDemoData() {
    const resetData = resetStoredDashboardData(userId || undefined);
    setSessions(resetData.sessions);
    setStats(computeStatsFromSessions(resetData.sessions));

    setToastMsg("LocalStorage reset to 3 pristine showcase interviews.");
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Top weaknesses (max 5)
  const topWeaknesses = stats
    ? Object.entries(stats.weaknessAreas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  // Top strengths (max 3)
  const topStrengths = stats
    ? Object.entries(stats.strengthAreas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100">
      {/* Top Header */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-500 transition"
          >
            Rehearsal
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {isMock && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-sans text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Showcase Mode
              </span>
            )}
            {userName && (
              <span className="font-sans text-xs text-chalk-200/70 hidden sm:block">
                👤 {userName}
              </span>
            )}
            <Link
              href="/upload"
              className="rounded border border-amber-500 bg-amber-500 px-4 py-2 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
            >
              + New Interview
            </Link>
            <button
              id="signout-btn"
              onClick={handleSignOut}
              disabled={signingOut}
              className="font-sans text-xs text-chalk-200/50 hover:text-chalk-100 transition disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Toast Alert */}
        {toastMsg && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-sans text-amber-300 flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>{toastMsg}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-chalk-200/50 hover:text-chalk-100 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Greeting + LocalStorage Action Bar */}
        <div className="border-b border-chalk-200/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-sans text-xs uppercase tracking-widest text-amber-400/80">
                Performance Dashboard
              </p>
              <span className="inline-flex items-center gap-1 rounded bg-ink-800 px-2 py-0.5 text-[10px] font-sans text-chalk-200/60 border border-chalk-200/10">
                💾 LocalStorage Sync Active
              </span>
            </div>
            <h1 className="font-serif text-3xl text-chalk-50">
              {userName ? `Good to see you, ${userName.split(" ")[0]}` : "Your Dashboard"}
            </h1>
            <p className="mt-1.5 font-sans text-sm text-chalk-200/60">
              Track your interviews, scores, and areas to improve over time.
            </p>
          </div>

          {/* Interactive Showcase Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="add-mock-interview-btn"
              onClick={handleAddMockInterview}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 font-sans text-xs font-medium text-amber-300 transition flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>+ Add Mock Interview</span>
            </button>
            <button
              type="button"
              id="reset-demo-data-btn"
              onClick={handleResetDemoData}
              className="rounded-lg border border-chalk-200/15 bg-ink-800/60 hover:bg-ink-800 px-3 py-1.5 font-sans text-xs font-medium text-chalk-200/70 hover:text-chalk-100 transition"
              title="Reset localStorage data to 3 demo sessions"
            >
              ↺ Reset Demo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-chalk-200/50 py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="font-sans text-sm">Loading your data…</span>
          </div>
        ) : (
          <>
            {/* Stats Grid: Number of Interviews Given and All */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              <StatCard
                label="Interviews Given"
                value={stats?.totalSessions ?? 0}
                sub={`${stats?.completedSessions ?? 0} completed · in localStorage`}
                accent="chalk"
              />
              <StatCard
                label="Avg Score"
                value={stats?.avgScore != null ? `${stats.avgScore}%` : "—"}
                sub="Across completed interviews"
                accent="amber"
              />
              <StatCard
                label="Peak Score"
                value={stats?.topScore != null ? `${stats.topScore}%` : "—"}
                sub="Personal best"
                accent="moss"
              />
              <StatCard
                label="Questions Done"
                value={stats?.totalQuestionsAnswered ?? 0}
                sub={`${stats?.highScoreAnswers ?? 0} scored ≥ 75`}
                accent="amber"
              />
            </div>

            {/* Areas to Improve + Strengths */}
            {(topWeaknesses.length > 0 || topStrengths.length > 0) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
                {/* Areas to Improve */}
                {topWeaknesses.length > 0 && (
                  <div className="rounded-xl border border-clay-500/20 bg-ink-900 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-2 w-2 rounded-full bg-clay-500" />
                      <h2 className="font-sans text-xs uppercase tracking-widest text-clay-400">
                        Areas to Improve
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {topWeaknesses.map(([text, count]) => (
                        <li key={text} className="flex items-center justify-between gap-3">
                          <span className="font-sans text-sm text-chalk-200/80 capitalize line-clamp-1">
                            {text}
                          </span>
                          <span className="shrink-0 rounded-full bg-clay-500/15 border border-clay-500/20 px-2 py-0.5 font-sans text-[10px] text-clay-400">
                            ×{count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Top Strengths */}
                {topStrengths.length > 0 && (
                  <div className="rounded-xl border border-moss-500/20 bg-ink-900 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-2 w-2 rounded-full bg-moss-500" />
                      <h2 className="font-sans text-xs uppercase tracking-widest text-moss-500">
                        Top Strengths
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {topStrengths.map(([text, count]) => (
                        <li key={text} className="flex items-center justify-between gap-3">
                          <span className="font-sans text-sm text-chalk-200/80 capitalize line-clamp-1">
                            {text}
                          </span>
                          <span className="shrink-0 rounded-full bg-moss-500/15 border border-moss-500/20 px-2 py-0.5 font-sans text-[10px] text-moss-500">
                            ×{count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Category Breakdown */}
            {stats && Object.keys(stats.categoryBreakdown).length > 0 && (
              <div className="rounded-xl border border-chalk-200/10 bg-ink-900 p-5 mb-8">
                <h2 className="font-sans text-xs uppercase tracking-widest text-chalk-200/50 mb-4">
                  Score by Category
                </h2>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([cat, { total, avgScore }]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="font-sans text-xs text-chalk-200/70 capitalize w-36 shrink-0 truncate">
                          {cat.replace(/[-_]/g, " ")}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${avgScore}%`,
                              backgroundColor:
                                avgScore >= 80
                                  ? "#5C7A5A"
                                  : avgScore >= 60
                                  ? "#C88A2E"
                                  : "#B5563C",
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="font-serif text-sm"
                            style={{
                              color:
                                avgScore >= 80
                                  ? "#5C7A5A"
                                  : avgScore >= 60
                                  ? "#C88A2E"
                                  : "#B5563C",
                            }}
                          >
                            {avgScore}%
                          </span>
                          <span className="font-sans text-[10px] text-chalk-200/30">
                            ({total}q)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Interview History */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl text-chalk-50">
                  Interview History ({sessions.length})
                </h2>
                <span className="text-xs font-sans text-chalk-200/40">
                  Persisted in Browser LocalStorage
                </span>
              </div>

              {sessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-chalk-200/15 bg-ink-900/50 p-10 text-center">
                  <p className="font-serif text-lg text-chalk-100">
                    No interviews yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-chalk-200/60">
                    Upload your resume or click &quot;+ Add Mock Interview&quot; above to simulate an interview.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={handleAddMockInterview}
                      className="rounded bg-amber-500 px-4 py-2 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
                    >
                      ⚡ Add Mock Interview
                    </button>
                    <Link
                      href="/upload"
                      className="rounded border border-chalk-200/20 bg-ink-800 px-4 py-2 font-sans text-xs font-medium text-chalk-100 hover:bg-ink-700 transition"
                    >
                      Upload Resume →
                    </Link>
                  </div>
                </div>
              )}

              <div className="divide-y divide-chalk-200/10 border-t border-chalk-200/10">
                {sessions.map((s) => {
                  const answersCount = s.allAnswers?.length ?? 0;
                  const highCount = s.allAnswers?.filter((a) => (a.score ?? 0) >= 75).length ?? 0;

                  return (
                    <Link
                      key={s.id}
                      href={`/interview/${s.id}`}
                      className="group flex items-center justify-between py-4 px-3 rounded-lg hover:bg-ink-900/70 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-serif text-base text-chalk-50 group-hover:text-amber-400 transition">
                            {s.role}
                          </p>
                          {s.domain && (
                            <span className="rounded bg-ink-800 px-2 py-0.5 font-sans text-[10px] text-chalk-200/60 border border-chalk-200/10">
                              {s.domain}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 font-sans text-[10px] border capitalize ${
                              s.status === "completed"
                                ? "bg-moss-500/10 text-moss-500 border-moss-500/20"
                                : s.status === "in_progress"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-chalk-200/5 text-chalk-200/40 border-chalk-200/10"
                            }`}
                          >
                            {s.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="font-sans text-xs text-chalk-200/40">
                            {new Date(s.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {answersCount > 0 && (
                            <span className="font-sans text-[11px] text-chalk-200/40">
                              {answersCount} answered · {highCount} ≥ 75
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4 shrink-0">
                        {s.overall_score != null ? (
                          <div className="relative flex items-center justify-center">
                            <ScoreRing score={Math.round(s.overall_score)} size={48} />
                            <span
                              className="absolute font-serif text-sm"
                              style={{
                                color:
                                  s.overall_score >= 80
                                    ? "#5C7A5A"
                                    : s.overall_score >= 60
                                    ? "#C88A2E"
                                    : "#B5563C",
                              }}
                            >
                              {Math.round(s.overall_score)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-serif text-xl text-chalk-200/30">—</span>
                        )}
                        <span className="text-chalk-200/30 group-hover:text-amber-400 transition text-sm">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
