"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listSessions, type Session } from "@/lib/api";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSessions(DEV_USER_ID)
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  const completedSessions = sessions.filter((s) => s.status === "completed" && s.overall_score != null);
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overall_score ?? 0), 0) / completedSessions.length
        )
      : null;

  const topScore =
    completedSessions.length > 0
      ? Math.round(Math.max(...completedSessions.map((s) => s.overall_score ?? 0)))
      : null;

  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100">
      {/* Top Header */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-500 transition">
            Rehearsal
          </Link>
          <Link
            href="/upload"
            className="rounded bg-amber-500 px-4 py-2 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
          >
            + New Mock Interview
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="border-b border-chalk-200/10 pb-6">
          <h1 className="font-serif text-3xl text-chalk-50">Performance Dashboard</h1>
          <p className="mt-2 font-sans text-sm text-chalk-200/70">
            Track your interview progression, Gemini scores, and feedback across past mock sessions.
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-chalk-200/10 bg-ink-900 p-5">
            <span className="font-sans text-xs uppercase tracking-wider text-chalk-200/50">Total Sessions</span>
            <p className="mt-2 font-serif text-3xl text-chalk-50">{sessions.length}</p>
            <span className="font-sans text-[11px] text-chalk-200/40">{completedSessions.length} completed</span>
          </div>

          <div className="rounded-lg border border-chalk-200/10 bg-ink-900 p-5">
            <span className="font-sans text-xs uppercase tracking-wider text-chalk-200/50">Average Score</span>
            <p className="mt-2 font-serif text-3xl text-amber-400">{avgScore !== null ? `${avgScore}` : "—"}</p>
            <span className="font-sans text-[11px] text-chalk-200/40">Across all completed interviews</span>
          </div>

          <div className="rounded-lg border border-chalk-200/10 bg-ink-900 p-5">
            <span className="font-sans text-xs uppercase tracking-wider text-chalk-200/50">Peak Score</span>
            <p className="mt-2 font-serif text-3xl text-moss-400">{topScore !== null ? `${topScore}` : "—"}</p>
            <span className="font-sans text-[11px] text-chalk-200/40">Personal best performance</span>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mt-10">
          <h2 className="font-serif text-xl text-chalk-50">Interview History</h2>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-chalk-200/50">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="font-sans text-sm">Loading sessions…</span>
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="mt-8 rounded-lg border border-dashed border-chalk-200/20 bg-ink-900/50 p-8 text-center">
              <p className="font-serif text-lg text-chalk-100">No mock interviews completed yet</p>
              <p className="mt-1 font-sans text-sm text-chalk-200/60">
                Upload your resume and prepare for your target placement role.
              </p>
              <Link
                href="/upload"
                className="mt-6 inline-block rounded bg-amber-500 px-5 py-2.5 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
              >
                Start First Mock Interview →
              </Link>
            </div>
          )}

          <div className="mt-6 divide-y divide-chalk-200/10 border-t border-chalk-200/10">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/interview/${s.id}`}
                className="group flex items-center justify-between py-4 px-2 hover:bg-ink-900/60 rounded transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg text-chalk-50 group-hover:text-amber-400 transition">{s.role}</p>
                    {s.domain && (
                      <span className="rounded bg-ink-800 px-2 py-0.5 font-sans text-[11px] text-chalk-200/70 border border-chalk-200/10">
                        {s.domain}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-sans text-xs text-chalk-200/50">
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · <span className="capitalize">{s.status.replace("_", " ")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-sans text-[11px] uppercase tracking-wider text-chalk-200/40 block">Score</span>
                    <span
                      className={`font-serif text-xl ${
                        s.overall_score != null && s.overall_score >= 80
                          ? "text-moss-400"
                          : s.overall_score != null && s.overall_score >= 60
                          ? "text-amber-400"
                          : "text-chalk-200/70"
                      }`}
                    >
                      {s.overall_score != null ? Math.round(s.overall_score) : "—"}
                    </span>
                  </div>
                  <span className="text-chalk-200/40 group-hover:text-amber-400 transition">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
