"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminAssessmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/admin/assessments/${id}`);
        const json = await res.json();
        if (json.success) setSession(json.assessment);
      } catch {}
      setLoading(false);
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="p-8 font-sans text-sm text-slate-500">Loading assessment details…</div>;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link href="/admin/assessments" className="text-xs font-sans text-indigo-600">
          ← Back to Assessments
        </Link>
        <p className="font-sans text-sm text-slate-600">Assessment session not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/admin/assessments"
            className="text-xs font-sans text-slate-500 hover:text-indigo-600 transition block mb-2"
          >
            ← Back to Assessments
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">
            {session.role}
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Candidate: <strong>{session.profiles?.full_name || "Candidate"}</strong> · Domain: {session.domain || "General"}
          </p>
        </div>
        {session.overall_score != null && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
              Overall Score
            </span>
            <p className="font-serif text-3xl font-semibold text-indigo-900 mt-0.5">
              {Math.round(session.overall_score)}%
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-slate-900">
          Questions & Candidate Answers ({session.questions?.length || 0})
        </h2>

        {(session.questions || []).map((q: any, idx: number) => (
          <div key={q.id || idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-4">
              <span className="font-serif text-base font-semibold text-slate-900">
                Q{idx + 1}. {q.prompt}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-sans shrink-0">
                {q.category || "General"}
              </span>
            </div>

            {q.answers && q.answers.length > 0 ? (
              q.answers.map((a: any) => (
                <div key={a.id} className="mt-3 border-t border-slate-100 pt-3 space-y-2 text-xs font-sans">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                    <strong>Candidate Response:</strong> {a.answer_text}
                  </div>
                  {a.score != null && (
                    <div className="flex items-center gap-4 text-slate-600">
                      <span>Score: <strong className="text-indigo-600 font-serif">{a.score}%</strong></span>
                    </div>
                  )}
                  {a.feedback && (
                    <p className="text-slate-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      <strong>AI Feedback:</strong> {a.feedback}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs font-sans text-slate-400 italic">No answer submitted.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
