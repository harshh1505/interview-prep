"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, BookOpen, TrendingUp, Activity, CheckCircle2 } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPrograms: number;
  avgCompletionRate: number;
  roleDistribution: {
    user: number;
    admin: number;
  };
  dailyRegistrations: number[];
  recentActivity: Array<{ id: string; text: string; timeAgo: string }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPrograms: 0,
    avgCompletionRate: 0,
    roleDistribution: { user: 0, admin: 0 },
    dailyRegistrations: new Array(30).fill(0),
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats({
            totalUsers: data.stats.totalUsers || 0,
            activeUsers: data.stats.activeUsers || 0,
            totalPrograms: data.stats.totalPrograms || 0,
            avgCompletionRate: data.stats.avgCompletionRate || 0,
            roleDistribution: data.stats.roleDistribution || { user: 0, admin: 0 },
            dailyRegistrations: data.stats.dailyRegistrations || new Array(30).fill(0),
            recentActivity: data.stats.recentActivity || [],
          });
        }
      })
      .catch((err) => console.warn("Admin stats fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalAccounts = stats.roleDistribution.user + stats.roleDistribution.admin;
  const userPct = totalAccounts > 0 ? Math.round((stats.roleDistribution.user / totalAccounts) * 100) : 0;
  const adminPct = totalAccounts > 0 ? Math.round((stats.roleDistribution.admin / totalAccounts) * 100) : 0;
  const maxRegs = Math.max(...stats.dailyRegistrations, 1);

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Compact Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-[#1E2544]">Overview</h1>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">
            Real-time platform statistics from database.
          </p>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
          Live Database Feed
        </span>
      </div>

      {/* Row 1: 4 Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Total Users
            </span>
            <p className="text-2xl font-black text-[#1E2544] mt-0.5">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Active Users (30d)
            </span>
            <p className="text-2xl font-black text-[#1E2544] mt-0.5">{stats.activeUsers.toLocaleString()}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Total Programs
            </span>
            <p className="text-2xl font-black text-[#1E2544] mt-0.5">{stats.totalPrograms}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Completion Rate
            </span>
            <p className="text-2xl font-black text-[#1E2544] mt-0.5">{stats.avgCompletionRate}%</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Row 2: User Registrations + Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Registrations Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div>
              <h2 className="text-xs font-black text-[#1E2544]">User Registrations</h2>
              <p className="text-[10px] text-gray-400">Daily signups recorded in database (last 30 days)</p>
            </div>
            <span className="text-[10px] font-extrabold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-lg">
              Last 30 days
            </span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-1.5 pt-4 px-1 border-b border-gray-100 min-h-0">
            {stats.dailyRegistrations.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end">
                <div
                  style={{ height: `${val > 0 ? Math.max((val / maxRegs) * 100, 15) : 5}%` }}
                  className={`w-full rounded-t transition-all duration-200 ${
                    val > 0 ? "bg-[#2563EB] group-hover:bg-indigo-600" : "bg-gray-100"
                  }`}
                  title={`Day ${i + 1}: ${val} signups`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 shrink-0">
            <span>30 days ago</span>
            <span>15 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Role Distribution Chart */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0">
            <h2 className="text-xs font-black text-[#1E2544]">Role Distribution</h2>
            <p className="text-[10px] text-gray-400">Database user role breakdown</p>
          </div>

          {/* Donut graphic */}
          <div className="my-auto py-2 flex justify-center relative">
            <div className="w-28 h-28 rounded-full border-[14px] border-[#2563EB] border-t-[#F97316] rotate-45 flex items-center justify-center shadow-xs">
              <div className="text-center -rotate-45">
                <p className="text-base font-black text-[#1E2544]">{stats.totalUsers}</p>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase">Accounts</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[11px] font-bold shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-gray-700">Candidates (Users)</span>
              </div>
              <span className="text-[#1E2544]">
                {stats.roleDistribution.user} ({userPct}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                <span className="text-gray-700">Administrators</span>
              </div>
              <span className="text-[#1E2544]">
                {stats.roleDistribution.admin} ({adminPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity & System Status */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-[#1E2544] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Recent Platform Activity</span>
          </h2>
          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Supabase DB Connected</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
          {stats.recentActivity.length === 0 ? (
            <div className="col-span-3 text-center py-2 text-slate-400 text-xs font-normal">
              No recent activity recorded in database.
            </div>
          ) : (
            stats.recentActivity.map((act) => (
              <div key={act.id} className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-200/80 flex items-center justify-between">
                <span className="truncate pr-2">{act.text}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{act.timeAgo}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

