"use client";

import { useState, useEffect, useCallback } from "react";

interface AnalyticsData {
  totalRegistrations: number;
  totalSessions: number;
  completedSessions: number;
  avgScore: number;
  passRate: number;
  roleDistribution: {
    users: number;
    admins: number;
  };
  growthTrend: Array<{ date: string; users: number; sessions: number }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) setData(json.analytics);
    } catch {}
    setLoading(false);
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">
            Platform Analytics
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Data insights, role distribution, user growth, and performance trends.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          {[
            { label: "7 Days", value: "7d" },
            { label: "30 Days", value: "30d" },
            { label: "90 Days", value: "90d" },
            { label: "1 Year", value: "1y" },
            { label: "All Time", value: "all" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={`px-3 py-1.5 font-sans text-xs font-medium rounded-lg transition ${
                range === item.value
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-6" />
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {/* Key Analytics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                User Registrations
              </span>
              <p className="font-serif text-3xl font-semibold text-slate-900 mt-2">
                {data.totalRegistrations}
              </p>
              <span className="block text-[11px] text-slate-500 mt-1">In selected range</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Interviews Conducted
              </span>
              <p className="font-serif text-3xl font-semibold text-indigo-600 mt-2">
                {data.totalSessions}
              </p>
              <span className="block text-[11px] text-slate-500 mt-1">
                {data.completedSessions} completed
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Mean Assessment Score
              </span>
              <p className="font-serif text-3xl font-semibold text-emerald-600 mt-2">
                {data.avgScore}%
              </p>
              <span className="block text-[11px] text-slate-500 mt-1">Platform average</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Assessment Pass Rate
              </span>
              <p className="font-serif text-3xl font-semibold text-purple-600 mt-2">
                {data.passRate}%
              </p>
              <span className="block text-[11px] text-slate-500 mt-1">Score ≥ 70%</span>
            </div>
          </div>

          {/* Detailed Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Distribution Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Role Distribution
              </h2>
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>User Role (Candidates)</span>
                    <span className="font-semibold text-indigo-600">{data.roleDistribution.users}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${
                          (data.roleDistribution.users /
                            (data.roleDistribution.users + data.roleDistribution.admins || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 font-medium mb-1">
                    <span>Admin Role (Administrators)</span>
                    <span className="font-semibold text-purple-600">{data.roleDistribution.admins}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{
                        width: `${
                          (data.roleDistribution.admins /
                            (data.roleDistribution.users + data.roleDistribution.admins || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Score Distribution Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Score Distribution
              </h2>
              <div className="grid grid-cols-2 gap-4 font-sans text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-semibold block">Excellent (≥ 85%)</span>
                  <span className="font-serif text-2xl text-emerald-900 font-semibold mt-1 block">
                    {data.scoreDistribution.excellent}
                  </span>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-indigo-800 font-semibold block">Good (70-84%)</span>
                  <span className="font-serif text-2xl text-indigo-900 font-semibold mt-1 block">
                    {data.scoreDistribution.good}
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 font-semibold block">Average (60-69%)</span>
                  <span className="font-serif text-2xl text-amber-900 font-semibold mt-1 block">
                    {data.scoreDistribution.average}
                  </span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-800 font-semibold block">Needs Work (&lt; 60%)</span>
                  <span className="font-serif text-2xl text-rose-900 font-semibold mt-1 block">
                    {data.scoreDistribution.needsImprovement}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
