"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AssessmentItem {
  id: string;
  role: string;
  domain: string;
  candidateName: string;
  candidateId: string;
  status: string;
  overallScore: number | null;
  questionCount: number;
  createdAt: string;
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const res = await fetch("/api/admin/assessments");
        const json = await res.json();
        if (json.success) setAssessments(json.assessments || []);
      } catch {}
      setLoading(false);
    }
    fetchAssessments();
  }, []);

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Assessments & Interviews
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Review all technical and behavioral mock interview sessions conducted on the platform.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Candidate</th>
                <th className="py-3 px-4">Role & Domain</th>
                <th className="py-3 px-4 text-center">Questions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Overall Score</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-5"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 w-8 bg-slate-100 rounded mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 w-12 bg-slate-100 rounded mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No assessments recorded in database yet.
                  </td>
                </tr>
              ) : (
                assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-extrabold text-slate-900">{a.candidateName}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{a.role}</div>
                      <div className="text-[10px] text-slate-400">{a.domain}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-700">
                      {a.questionCount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black capitalize ${
                          a.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-sm text-indigo-700">
                      {a.overallScore != null ? `${a.overallScore}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/admin/assessments/${a.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1 font-bold text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        View Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
