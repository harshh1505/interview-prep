"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { listSessions, getSession, type Session, type Question, type Answer } from "@/lib/api";

interface EnrichedSession extends Session {
  questions?: Question[];
  allAnswers?: Answer[];
}

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  highScoreAnswers: number; // answers with score >= 75
  avgScore: number | null;
  topScore: number | null;
  weaknessAreas: Record<string, number>; // weakness text -> count
  strengthAreas: Record<string, number>; // strength text -> count
  categoryBreakdown: Record<string, { total: number; avgScore: number }>;
}

function computeStats(sessions: EnrichedSession[]): DashboardStats {
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.overall_score != null
  );

  let totalQuestionsAnswered = 0;
  let highScoreAnswers = 0;
  const weaknessMap: Record<string, number> = {};
  const strengthMap: Record<string, number> = {};
  const categoryMap: Record<string, { scores: number[] }> = {};

  for (const session of sessions) {
    const answers = session.allAnswers || [];
    totalQuestionsAnswered += answers.length;

    for (const answer of answers) {
      if ((answer.score ?? 0) >= 75) highScoreAnswers++;

      // Collect weaknesses
      for (const w of answer.weaknesses || []) {
        const key = w.trim().toLowerCase();
        if (key) weaknessMap[key] = (weaknessMap[key] || 0) + 1;
      }
      // Collect strengths
      for (const s of answer.strengths || []) {
        const key = s.trim().toLowerCase();
        if (key) strengthMap[key] = (strengthMap[key] || 0) + 1;
      }

      // Category breakdown
      const cat = (session.questions?.find((q) => q.id === answer.question_id)?.category) || "general";
      if (!categoryMap[cat]) categoryMap[cat] = { scores: [] };
      if (answer.score != null) categoryMap[cat].scores.push(answer.score);
    }
  }

  const categoryBreakdown: Record<string, { total: number; avgScore: number }> = {};
  for (const [cat, { scores }] of Object.entries(categoryMap)) {
    categoryBreakdown[cat] = {
      total: scores.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }

  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((acc, s) => acc + (s.overall_score ?? 0), 0) / completed.length)
      : null;

  const topScore =
    completed.length > 0
      ? Math.round(Math.max(...completed.map((s) => s.overall_score ?? 0)))
      : null;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalQuestionsAnswered,
    highScoreAnswers,
    avgScore,
    topScore,
    weaknessAreas: weaknessMap,
    strengthAreas: strengthMap,
    categoryBreakdown,
  };
}

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
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(async (uid: string) => {
    try {
      const { sessions: rawSessions } = await listSessions(uid);

      // Enrich completed sessions with answers data for stats
      const enriched: EnrichedSession[] = await Promise.all(
        rawSessions.map(async (s) => {
          if (s.status === "completed") {
            try {
              const detail = await getSession(s.id);
              const allAnswers = detail.questions.flatMap((q) => q.answers || []);
              return { ...s, questions: detail.questions, allAnswers };
            } catch {
              return s;
            }
          }
          return s;
        })
      );

      setSessions(enriched);
      setStats(computeStats(enriched));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const name =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Candidate";
      setUserName(name);
      setUserId(user.id);
      loadData(user.id);
    });
  }, [router, loadData]);

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
          <div className="flex items-center gap-4">
            {userName && (
              <span className="font-sans text-xs text-chalk-200/50 hidden sm:block">
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
        {/* Greeting */}
        <div className="border-b border-chalk-200/10 pb-6 mb-8">
          <p className="font-sans text-xs uppercase tracking-widest text-amber-400/80 mb-1">
            Performance Dashboard
          </p>
          <h1 className="font-serif text-3xl text-chalk-50">
            {userName ? `Good to see you, ${userName.split(" ")[0]}` : "Your Dashboard"}
          </h1>
          <p className="mt-1.5 font-sans text-sm text-chalk-200/60">
            Track your interviews, scores, and areas to improve over time.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-chalk-200/50 py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="font-sans text-sm">Loading your data…</span>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
              <StatCard
                label="Total Sessions"
                value={stats?.totalSessions ?? 0}
                sub={`${stats?.completedSessions ?? 0} completed`}
                accent="chalk"
              />
              <StatCard
                label="Avg Score"
                value={stats?.avgScore != null ? `${stats.avgScore}` : "—"}
                sub="Across completed sessions"
                accent="amber"
              />
              <StatCard
                label="Peak Score"
                value={stats?.topScore != null ? `${stats.topScore}` : "—"}
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
                        <span className="font-sans text-xs text-chalk-200/70 capitalize w-28 shrink-0">
                          {cat.replace("-", " ")}
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
                            {avgScore}
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
              <h2 className="font-serif text-xl text-chalk-50 mb-5">
                Interview History
              </h2>

              {sessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-chalk-200/15 bg-ink-900/50 p-10 text-center">
                  <p className="font-serif text-lg text-chalk-100">
                    No interviews yet
                  </p>
                  <p className="mt-1 font-sans text-sm text-chalk-200/60">
                    Upload your resume and start your first mock interview.
                  </p>
                  <Link
                    href="/upload"
                    className="mt-6 inline-block rounded bg-amber-500 px-5 py-2.5 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
                  >
                    Start First Interview →
                  </Link>
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
