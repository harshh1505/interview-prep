"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileCheck,
  Award,
  User,
  LogOut,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart2,
  Clock,
} from "lucide-react";

interface AreaToImprove {
  text: string;
  count: number;
}

interface TopStrength {
  text: string;
  count: number;
}

interface CategoryScore {
  name: string;
  score: number;
  questionCount: number;
}

interface InterviewHistoryItem {
  id: string;
  role: string;
  domain: string;
  status: string;
  createdAt: string;
  questionsAnswered: number;
  highScoreQuestions: number;
  overallScore: number | null;
}

interface DashboardData {
  user: {
    id: string;
    fullName: string;
    targetRole: string;
    role: string;
    createdAt: string;
  };
  stats: {
    interviewsGiven: number;
    avgScore: number;
    peakScore: number;
    questionsDone: number;
    questionsHighScored: number;
    certificates: number;
    totalSessions: number;
  };
  areasToImprove: AreaToImprove[];
  topStrengths: TopStrength[];
  scoreByCategory: CategoryScore[];
  interviewHistory: InterviewHistoryItem[];
  inProgressSession: any | null;
  availablePrograms: any[];
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/dashboard");
      const json = await res.json();
      if (res.status === 401 || !json.success) {
        router.push("/login");
        return;
      }
      setData(json);
    } catch (err) {
      console.warn("Failed to fetch candidate dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
    data?.user?.fullName && data.user.fullName !== "Candidate"
      ? data.user.fullName
      : clientUser || data?.user?.fullName || "Candidate";

  const firstName = fullName.split(" ")[0] || "Candidate";
  const initials =
    fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CN";

  const stats = data?.stats || {
    interviewsGiven: 0,
    avgScore: 0,
    peakScore: 0,
    questionsDone: 0,
    questionsHighScored: 0,
    certificates: 0,
    totalSessions: 0,
  };

  const areasToImprove = data?.areasToImprove || [];
  const topStrengths = data?.topStrengths || [];
  const scoreByCategory = data?.scoreByCategory || [];
  const interviewHistory = data?.interviewHistory || [];
  const inProgressSession = data?.inProgressSession;
  const availablePrograms = data?.availablePrograms || [];

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
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Overview</span>
            </Link>
            <Link
              href="/my-learning"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <GraduationCap className="w-4 h-4 text-slate-400" />
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
            <p className="text-[10px] font-semibold text-blue-600 truncate">{data?.user?.targetRole || "Candidate"}</p>
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
              placeholder="Search interview tracks, domain skills..."
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

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 bg-[#F8FAFC] flex flex-col gap-6 min-h-[calc(100vh-56px)]">
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                Welcome back, {fullName} 👋
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Target Track: <strong className="text-blue-700 font-extrabold">{data?.user?.targetRole || "Software Engineer"}</strong> · Real Database Analytics Active
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Feed
            </span>
          </div>

          {/* Active Session Notice Card (if any) */}
          {inProgressSession && (
            <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    SESSION IN PROGRESS
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{inProgressSession.role}</h3>
                  <p className="text-xs text-slate-600">
                    Domain: {inProgressSession.domain || "General"} · Started {new Date(inProgressSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <Link
                href={`/interview/${inProgressSession.id}`}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
              >
                <span>Resume Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* SECTION 1: 4 Performance KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {/* Interviews Given */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                INTERVIEWS GIVEN
              </p>
              <div className="mt-2">
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.interviewsGiven}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  {stats.interviewsGiven} completed in database
                </p>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                AVG SCORE
              </p>
              <div className="mt-2">
                <p className="text-3xl font-black text-blue-600 tracking-tight">{stats.avgScore}%</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  Across completed interviews
                </p>
              </div>
            </div>

            {/* Peak Score */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                PEAK SCORE
              </p>
              <div className="mt-2">
                <p className="text-3xl font-black text-emerald-600 tracking-tight">{stats.peakScore}%</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  Personal best
                </p>
              </div>
            </div>

            {/* Questions Done */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                QUESTIONS DONE
              </p>
              <div className="mt-2">
                <p className="text-3xl font-black text-indigo-600 tracking-tight">{stats.questionsDone}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  {stats.questionsHighScored} scored ≥ 75
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Areas to Improve & Top Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Areas to Improve */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-rose-600">
                  AREAS TO IMPROVE
                </h2>
              </div>

              <div className="space-y-2.5 flex-1">
                {areasToImprove.length === 0 ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    No critical weaknesses flagged yet. Complete AI mock interviews to generate diagnostic feedback.
                  </div>
                ) : (
                  areasToImprove.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/80 flex items-center justify-between text-xs"
                    >
                      <p className="font-semibold text-slate-800 leading-snug pr-2 truncate">
                        {item.text}
                      </p>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md shrink-0">
                        x{item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Strengths */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600">
                  TOP STRENGTHS
                </h2>
              </div>

              <div className="space-y-2.5 flex-1">
                {topStrengths.length === 0 ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    Key strengths will be highlighted automatically as you practice AI mock interviews.
                  </div>
                ) : (
                  topStrengths.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80 flex items-center justify-between text-xs"
                    >
                      <p className="font-semibold text-slate-800 leading-snug pr-2 truncate">
                        {item.text}
                      </p>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                        x{item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Score by Category */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              SCORE BY CATEGORY
            </h2>

            <div className="space-y-4">
              {scoreByCategory.map((cat, idx) => {
                const barColor =
                  cat.score >= 70
                    ? "bg-emerald-500"
                    : cat.score >= 45
                    ? "bg-amber-500"
                    : "bg-rose-500";

                const textColor =
                  cat.score >= 70
                    ? "text-emerald-600"
                    : cat.score >= 45
                    ? "text-amber-600"
                    : "text-rose-600";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black ${textColor}`}>{cat.score}%</span>
                        <span className="text-[10px] font-semibold text-slate-400">({cat.questionCount}q)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(cat.score, 5)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Interview History */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">
                Interview History ({interviewHistory.length})
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                Persisted in Supabase PostgreSQL
              </span>
            </div>

            <div className="space-y-3">
              {interviewHistory.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No completed interviews recorded yet. Click <strong>+ Start Mock Interview</strong> above to begin!
                </div>
              ) : (
                interviewHistory.map((item) => {
                  const scoreVal = item.overallScore;
                  const badgeBorder =
                    scoreVal != null && scoreVal >= 75
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : scoreVal != null && scoreVal >= 50
                      ? "border-amber-500 text-amber-700 bg-amber-50"
                      : "border-rose-500 text-rose-700 bg-rose-50";

                  return (
                    <Link
                      key={item.id}
                      href={`/interview/${item.id}`}
                      className="group bg-slate-50/70 hover:bg-slate-100/90 rounded-2xl p-4 border border-slate-200/80 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                            {item.role}
                          </h3>
                          {item.domain && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                              {item.domain}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              item.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {item.questionsAnswered} answered · {item.highScoreQuestions} ≥ 75
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full border-2 ${badgeBorder} font-black text-xs flex items-center justify-center shadow-xs shrink-0`}
                        >
                          {scoreVal != null ? `${scoreVal}` : "—"}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
