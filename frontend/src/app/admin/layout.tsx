"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Route,
  FileCheck,
  BarChart3,
  FileText,
  Bell,
  Activity,
  ShieldCheck,
  Settings,
  User,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Programs", href: "/admin/programs", icon: BookOpen },
      { label: "Learning Paths", href: "/admin/learning-paths", icon: Route },
      { label: "Assessments", href: "/admin/assessments", icon: FileCheck },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Reports", href: "/admin/reports", icon: FileText },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "System Health", href: "/admin/system", icon: Activity },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login" || pathname === "/admin/signup") {
    return <>{children}</>;
  }

  async function handleSignOut() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/role-selection");
  }

  const isItemActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar (w-56) */}
      <aside className="w-full md:w-56 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-20 shadow-2xs">
        <div className="flex flex-col h-full min-h-0">
          {/* Logo Header */}
          <div className="h-14 px-5 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#1E2544]">PrepPilot</span>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-amber-500/10 text-[#F97316] font-extrabold border border-amber-200/50 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-[#F97316]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Account Footer */}
          <div className="p-3 border-t border-slate-100 space-y-0.5 shrink-0">
            <p className="px-3 py-1 text-[9px] font-black tracking-widest uppercase text-slate-400">
              ADMINISTRATOR
            </p>
            <Link
              href="/admin/settings"
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === "/admin/settings" && false
                  ? "bg-amber-500/10 text-[#F97316]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Admin Profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition text-left"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F8FAFC]">
        {/* Fixed Compact Top Header (h-14) */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-2xs">
          {/* Search bar with shortcut key */}
          <div className="relative w-72 sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, programs, assessments..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-8 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-[#F97316] focus:outline-none transition"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
              ⌘K
            </span>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/notifications"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition relative"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span className="w-2 h-2 rounded-full bg-[#F97316] absolute top-1.5 right-1.5 border-2 border-white" />
            </Link>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 rounded-xl bg-[#F97316] text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                SA
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-extrabold text-[#1E2544] leading-none">System Admin</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content Container */}
        <main className="flex-1 bg-[#F8FAFC] min-h-[calc(100vh-56px)]">{children}</main>
      </div>
    </div>
  );
}
