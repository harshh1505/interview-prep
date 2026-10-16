"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface UserDetail {
  id: string;
  fullName: string;
  targetRole: string;
  role: "user" | "admin";
  resumeText?: string;
  resumeUrl?: string;
  createdAt: string;
  status: string;
  metrics: {
    totalSessions: number;
    completedSessions: number;
    avgScore: number | null;
    strengths: string[];
    weaknesses: string[];
  };
  sessions: any[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role promotion/demotion confirmation modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<"user" | "admin">("user");
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  const fetchUserDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load user details.");
        setLoading(false);
        return;
      }

      setUser(json.user);
    } catch (err: any) {
      setError("Network error fetching user details.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  function handleOpenRoleModal(newRole: "user" | "admin") {
    setPendingRole(newRole);
    setModalFeedback(null);
    setShowRoleModal(true);
  }

  async function handleConfirmRoleChange() {
    setRoleUpdating(true);
    setModalFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setModalFeedback(json.error || "Failed to change user role.");
        setRoleUpdating(false);
        return;
      }

      setShowRoleModal(false);
      setRoleUpdating(false);
      fetchUserDetail();
    } catch (err: any) {
      setModalFeedback("Network error performing role change.");
      setRoleUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6" />
          <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="text-xs font-sans text-indigo-600 hover:underline flex items-center gap-1"
        >
          ← Back to Users Directory
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 font-sans">
          <p className="font-semibold text-lg">Error loading candidate</p>
          <p className="mt-1 text-sm">{error || "Candidate record not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 mb-1"
          >
            ← Back to User Directory
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900">
              {user.fullName}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>

        {/* Role Change Admin Action Buttons */}
        <div className="flex items-center gap-2">
          {user.role === "user" ? (
            <button
              type="button"
              onClick={() => handleOpenRoleModal("admin")}
              className="rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 font-bold text-xs text-purple-800 hover:bg-purple-100 transition shadow-xs"
            >
              Promote User to Admin ↑
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenRoleModal("user")}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 font-bold text-xs text-amber-800 hover:bg-amber-100 transition shadow-xs"
            >
              Demote Admin to User ↓
            </button>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-3 pr-1">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg font-medium text-slate-900 border-b border-slate-100 pb-3">
            Profile Information
          </h2>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Full Name
            </span>
            <p className="font-sans text-sm font-medium text-slate-900 mt-0.5">{user.fullName}</p>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              User ID
            </span>
            <p className="font-mono text-xs text-slate-600 mt-0.5 break-all">{user.id}</p>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Target Role / Track
            </span>
            <p className="font-sans text-sm text-slate-900 mt-0.5">{user.targetRole}</p>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Role
            </span>
            <p className="font-sans text-sm font-semibold capitalize text-indigo-700 mt-0.5">
              {user.role}
            </p>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Account Created
            </span>
            <p className="font-sans text-xs text-slate-600 mt-0.5">
              {new Date(user.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Performance & Learning Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance KPI summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Interviews Given
              </span>
              <p className="font-serif text-3xl font-semibold text-slate-900 mt-1">
                {user.metrics.totalSessions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Completed
              </span>
              <p className="font-serif text-3xl font-semibold text-emerald-600 mt-1">
                {user.metrics.completedSessions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Avg Assessment Score
              </span>
              <p className="font-serif text-3xl font-semibold text-indigo-600 mt-1">
                {user.metrics.avgScore != null ? `${user.metrics.avgScore}%` : "—"}
              </p>
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-3">
                Strengths
              </h3>
              {user.metrics.strengths.length > 0 ? (
                <ul className="space-y-1 text-xs font-sans text-emerald-900">
                  {user.metrics.strengths.map((s, idx) => (
                    <li key={idx}>✓ {s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No strength data recorded yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-rose-800 mb-3">
                Weaknesses / Areas to Improve
              </h3>
              {user.metrics.weaknesses.length > 0 ? (
                <ul className="space-y-1 text-xs font-sans text-rose-900">
                  {user.metrics.weaknesses.map((w, idx) => (
                    <li key={idx}>• {w}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No weakness data recorded yet.</p>
              )}
            </div>
          </div>

          {/* Assessment History Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900 mb-4">
              Interview & Assessment History ({user.sessions.length})
            </h3>
            {user.sessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">
                This user has not completed any assessment sessions yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {user.sessions.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="font-semibold text-slate-900">{s.role}</span>
                      {s.domain && <span className="ml-2 text-slate-500">({s.domain})</span>}
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          s.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.overall_score != null && (
                        <span className="font-serif text-sm font-semibold text-indigo-700">
                          {Math.round(s.overall_score)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Role Change */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-serif text-xl font-semibold">
              <span>⚠️</span>
              <span>Confirm Role Change</span>
            </div>

            <p className="font-sans text-sm text-slate-600 leading-relaxed">
              Are you sure you want to change{" "}
              <strong>{user.fullName}</strong>&apos;s role from{" "}
              <span className="font-semibold capitalize text-slate-900">{user.role}</span> to{" "}
              <span className="font-semibold capitalize text-indigo-600">{pendingRole}</span>?
            </p>

            {pendingRole === "admin" && (
              <p className="text-xs bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl font-sans">
                Granting <strong>ADMIN</strong> role gives this account full access to user management, program configuration, analytics, and platform administration.
              </p>
            )}

            {modalFeedback && (
              <p className="text-xs bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl font-sans font-medium">
                {modalFeedback}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                disabled={roleUpdating}
                className="rounded-lg border border-slate-300 px-4 py-2 font-sans text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={roleUpdating}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-sans text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {roleUpdating ? "Updating Role…" : `Confirm ${pendingRole.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
