"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  GraduationCap,
  FileCheck,
  User,
  LogOut,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  CheckCircle2,
  Code,
  Server,
  Layers,
  Cpu,
} from "lucide-react";

interface UserProfile {
  fullName: string;
  targetRole: string;
  email?: string;
}

export default function MyLearningPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setProfile({
            fullName: json.user.fullName || "Learner",
            targetRole: json.user.targetRole || "Software Engineer",
            email: json.user.email,
          });
        }
      })
      .catch((err) => console.warn("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (e) {
      console.warn("Signout fetch warning:", e);
    }
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/role-selection");
  }

  const [clientUser, setClientUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cc = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cc_session=") || row.startsWith("mock_user_session="));
      if (cc) {
        const val = cc.split("=")[1];
        const parsed = JSON.parse(decodeURIComponent(val));
        if (parsed?.full_name && parsed.full_name !== "Candidate") {
          setClientUser(parsed.full_name);
        } else if (parsed?.user_metadata?.full_name && parsed.user_metadata.full_name !== "Candidate") {
          setClientUser(parsed.user_metadata.full_name);
        }
      }
    } catch (e) {}
  }, []);

  const fullName =
    profile?.fullName && profile.fullName !== "Candidate" && profile.fullName !== "Learner"
      ? profile.fullName
      : clientUser || profile?.fullName || "Learner";

  const initials =
    fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LN";

  const LEARNING_MODULES = [
    {
      id: "track-1",
      title: "Full-Stack & Distributed Systems",
      domain: "System Architecture",
      icon: Layers,
      color: "from-blue-600 to-indigo-600",
      description: "Master React, Node.js microservices, REST/gRPC APIs, and stateful database scaling.",
      level: "Intermediate / Advanced",
      modules: 12,
    },
    {
      id: "track-2",
      title: "Backend Infrastructure & Databases",
      domain: "Backend Engineering",
      icon: Server,
      color: "from-emerald-600 to-teal-600",
      description: "Deep dive into PostgreSQL indexing, Redis caching, message queues, and fault tolerance.",
      level: "Advanced",
      modules: 15,
    },
    {
      id: "track-3",
      title: "AI, RAG & Vector Embeddings",
      domain: "AI / ML Engineering",
      icon: Cpu,
      color: "from-purple-600 to-indigo-600",
      description: "Learn Pinecone vector search, Gemini 2.5 LLM prompt engineering, and semantic RAG pipelines.",
      level: "Advanced",
      modules: 10,
    },
    {
      id: "track-4",
      title: "Frontend Architecture & Web Vitals",
      domain: "Frontend Engineering",
      icon: Code,
      color: "from-amber-500 to-orange-600",
      description: "Next.js App Router, SSR/ISR optimization, TailWind CSS design systems, and TypeScript patterns.",
      level: "Intermediate",
      modules: 14,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <aside className="w-full md:w-56 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 md:h-screen md:sticky md:top-0 z-20 shadow-xs">
        <div>
          {/* Logo Header */}
          <div className="h-14 px-5 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">PrepPilot</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Overview</span>
            </Link>
            <Link
              href="/my-learning"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>My Learning</span>
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span>Mock Interview</span>
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Admin Console</span>
            </Link>
          </nav>
        </div>

        {/* Account Footer */}
        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <p className="px-3 py-1 text-[9px] font-black tracking-widest uppercase text-slate-400">
            ACCOUNT
          </p>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-2">
            <p className="text-xs font-extrabold text-slate-900 truncate">{fullName}</p>
            <p className="text-[10px] font-semibold text-blue-600 truncate">{profile?.targetRole || "Candidate"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-xs">
          <div className="relative w-72 sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search learning modules, domain skills..."
              className="w-full rounded-xl bg-slate-50/80 border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>+ Start Mock Interview</span>
            </Link>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-extrabold text-slate-900 leading-none">{fullName}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Learner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 bg-[#F8FAFC] flex flex-col gap-6 min-h-[calc(100vh-56px)]">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                PERSONAL LEARNING HUB
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                My Learning & Technical Tracks
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Curated domain tracks tailored for <strong className="text-blue-700 font-extrabold">{profile?.targetRole || "Software Engineering"}</strong>
              </p>
            </div>

            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
            >
              <FileCheck className="w-4 h-4" />
              <span>Practice AI Mock Interview →</span>
            </Link>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Tracks</p>
                <p className="text-2xl font-black text-blue-600 mt-1">4 Tracks</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Target Domain</p>
                <p className="text-sm font-black text-slate-900 mt-1 truncate max-w-[150px] sm:max-w-[180px]">
                  {profile?.targetRole || "Software Engineer"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">AI Coaching</p>
                <p className="text-sm font-black text-emerald-600 mt-1">Gemini 2.5 Active</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Learning Tracks Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Recommended Skill Tracks
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEARNING_MODULES.map((track) => {
                const Icon = track.icon;
                return (
                  <div
                    key={track.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${track.color} text-white flex items-center justify-center shadow-xs`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {track.domain}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{track.title}</h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-4">
                        {track.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400">
                        {track.modules} Modules · {track.level}
                      </span>
                      <Link
                        href="/upload"
                        className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                      >
                        <span>Start Track</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
