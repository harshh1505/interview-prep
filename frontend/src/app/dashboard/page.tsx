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
      .then((data) => setSessions(data.sessions))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-ink-950">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl text-chalk-50">Your sessions</h1>
          <Link href="/upload" className="font-sans text-sm text-amber-500 hover:text-amber-600">
            New session →
          </Link>
        </div>

        {loading && <p className="mt-8 font-sans text-sm text-chalk-200/50">Loading…</p>}

        {!loading && sessions.length === 0 && (
          <p className="mt-8 font-sans text-sm text-chalk-200/50">
            No sessions yet. Start your first mock interview.
          </p>
        )}

        <div className="mt-10 divide-y divide-chalk-200/10 border-t border-chalk-200/10">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-serif text-lg text-chalk-50">{s.role}</p>
                <p className="font-sans text-xs text-chalk-200/50">
                  {new Date(s.created_at).toLocaleDateString()} · {s.status}
                </p>
              </div>
              <span className="font-serif text-xl text-amber-500">
                {s.overall_score != null ? Math.round(s.overall_score) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
