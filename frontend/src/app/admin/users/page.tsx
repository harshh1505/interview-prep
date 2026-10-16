"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, MoreHorizontal, UserCheck, ShieldAlert, ArrowRight } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  target_role?: string;
  role: "user" | "admin";
  created_at: string;
  programs?: number;
  progress?: number;
  status?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalCount, setTotalCount] = useState(0);

  // Add User modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}`);
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        setTotalCount(data.pagination?.total || data.users.length);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.warn("Fetch users error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, targetRole, role }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowAddModal(false);
        setFullName("");
        fetchUsers();
      } else {
        alert(data.error || "Failed to create user.");
      }
    } catch {
      alert("Error creating user.");
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchStatus = statusFilter === "all" || (u.status || "Active") === statusFilter;
    return matchStatus;
  });

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-gray-900">Users Directory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage registered candidates and platform administrators.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs flex items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-gray-50 border border-gray-200/80 pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-xs focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">User (Candidate)</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-xs focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto">
        <div>
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-200/80 text-gray-500 font-extrabold uppercase tracking-wider sticky top-0 bg-white z-10">
              <tr>
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">Email / Account ID</th>
                <th className="py-3 px-5">Target Track</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Created</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-5"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-3 px-5 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No users matching criteria found in database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-5 font-bold text-gray-900">
                      <Link href={`/admin/users/${u.id}`} className="hover:text-blue-600 transition">
                        {u.full_name}
                      </Link>
                    </td>
                    <td className="py-3 px-5 text-gray-500 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-5 text-gray-600">{u.target_role || "General Candidate"}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100">
                        {u.status || "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-gray-500">{u.created_at.slice(0, 10)}</td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 font-bold text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        <span>View Detail</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0 bg-white">
          <span className="font-semibold">Showing 1 to {filteredUsers.length} of {totalCount} database profiles</span>
          <div className="flex items-center gap-1 font-bold">
            <button className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white">1</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 font-sans">
            <h2 className="text-lg font-black text-slate-900">Add New User Profile</h2>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ruba Muntaha"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Role / Track</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "user" | "admin")}
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="user">Candidate (User)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

