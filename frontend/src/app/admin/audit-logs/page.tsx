"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin/audit-logs");
        const json = await res.json();
        if (json.success) setLogs(json.auditLogs || []);
      } catch {}
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Admin Audit Logs
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Immutable audit record of administrator logins, role changes, and system modifications.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-5">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-5"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 font-mono text-[11px] text-slate-500">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{l.adminName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{l.targetType || "System"}</td>
                    <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                      {l.metadata ? JSON.stringify(l.metadata) : "—"}
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
