"use client";

import { useState } from "react";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  function handleDownload(reportType: "users" | "assessments" | "programs") {
    setDownloading(reportType);
    window.location.href = `/api/admin/reports?type=${reportType}&export=csv`;
    setTimeout(() => setDownloading(null), 1500);
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Reports & Exports
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Generate system reports and export raw platform data as CSV for auditing and external analysis.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
        {/* 1. USER REPORT */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xl">👤</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              User & Role Directory Report
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
              Export complete list of registered accounts, role assignments (user vs admin), target domains, and signup dates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload("users")}
            disabled={Boolean(downloading)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 font-bold text-xs text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>📥</span>
            <span>{downloading === "users" ? "Exporting CSV…" : "Export Users CSV"}</span>
          </button>
        </div>

        {/* 2. ASSESSMENT REPORT */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xl">📝</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Assessments & Scores Report
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
              Export detailed mock interview sessions, overall candidate performance scores, completion statuses, and dates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload("assessments")}
            disabled={Boolean(downloading)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 font-bold text-xs text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>📥</span>
            <span>{downloading === "assessments" ? "Exporting CSV…" : "Export Assessments CSV"}</span>
          </button>
        </div>

        {/* 3. PROGRAM REPORT */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xl">📚</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Programs & Enrollment Report
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
              Export program definitions, domain tracks, candidate enrollment numbers, and completion rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload("programs")}
            disabled={Boolean(downloading)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 font-bold text-xs text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>📥</span>
            <span>{downloading === "programs" ? "Exporting CSV…" : "Export Programs CSV"}</span>
          </button>
        </div>

        {/* 4. LEARNING PATHS REPORT */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xl">🗺️</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Learning Path Progression Report
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
              Export module progression metrics, average learning speeds, and candidate skill acquisition stats.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownload("users")}
            disabled={Boolean(downloading)}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 font-bold text-xs text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Learning Paths CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
