"use client";

import { useState, useEffect } from "react";

interface LearningPath {
  id: string;
  title: string;
  domain: string;
  assignedUsers: number;
  modulesCount: number;
  completedModules: number;
  avgProgress: number;
  status: string;
}

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaths() {
      try {
        const res = await fetch("/api/admin/learning-paths");
        const json = await res.json();
        if (json.success) setPaths(json.learningPaths || []);
      } catch {}
      setLoading(false);
    }
    fetchPaths();
  }, []);

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Learning Paths Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Monitor tailored AI-driven learning pathways, module completion, and candidate progression.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 p-4" />
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {paths.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-indigo-300 transition"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {p.domain}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{p.title}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {p.assignedUsers} candidates assigned · {p.completedModules} of {p.modulesCount} modules completed
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="w-36">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Progress</span>
                    <span className="font-extrabold text-indigo-600">{p.avgProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${p.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
