"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkApiHealth, createSession, uploadResume, type ApiHealth, type ResumeUploadResult } from "@/lib/api";
import { createSupabaseClient } from "@/lib/supabase";
import { getClientMockSession } from "@/lib/mock-auth";
import { Upload, FileText, CheckCircle2, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";

const FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000000";

const ROLE_PRESETS = [
  "Backend Engineer",
  "Full-Stack Engineer",
  "Frontend Engineer",
  "AI / ML Engineer",
  "DevOps / SRE",
  "Systems Engineer",
];

export default function UploadPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(FALLBACK_USER_ID);
  const [role, setRole] = useState("");
  const [domain, setDomain] = useState("");
  const [difficulty, setDifficulty] = useState<"entry" | "mid" | "senior">("mid");
  const [questionCount, setQuestionCount] = useState(5);
  const [file, setFile] = useState<File | null>(null);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string | null>(null);
  const [resumeResult, setResumeResult] = useState<ResumeUploadResult | null>(null);

  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<ApiHealth | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUserId(json.user.id);
          if (json.user.targetRole && !role) {
            setRole(json.user.targetRole);
          }
        }
      })
      .catch((err) => console.warn("Failed to load user profile:", err));

    checkApiHealth()
      .then(setHealth)
      .catch((err) => console.warn("API health check:", err));
  }, [role]);

  async function handleFileSelect(selectedFile: File | null) {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF document.");
      return;
    }
    setError(null);
    setFile(selectedFile);
    setUploadingResume(true);
    setIndexingProgress("Extracting text from PDF...");

    try {
      setTimeout(() => setIndexingProgress("Semantic chunking into section-aware paragraphs..."), 600);
      setTimeout(() => setIndexingProgress("Generating embeddings via Gemini..."), 1200);
      setTimeout(() => setIndexingProgress("Upserting vectors into database..."), 2000);

      const result = await uploadResume(userId, selectedFile);
      setResumeResult(result);
      setIndexingProgress(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse and chunk resume.");
      setIndexingProgress(null);
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim()) {
      setError("Please enter or select a target role.");
      return;
    }
    setError(null);
    setStartingSession(true);

    try {
      const useResume = Boolean(resumeResult || file);
      const { session } = await createSession({
        userId,
        role: role.trim(),
        domain: domain.trim() || undefined,
        difficulty,
        useResume,
        questionCount,
      });

      router.push(`/interview/${session.id}`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate interview questions. Verify backend is running and GEMINI_API_KEY is set in backend/.env"
      );
    } finally {
      setStartingSession(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2A3256] font-sans text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">PrepPilot</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition border border-slate-200 px-3 py-1 rounded-xl bg-white shadow-xs"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 min-h-[calc(100vh-56px)] max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5 bg-[#FEF9EF] rounded-t-[32px] border-x-4 border-t-4 border-[#EADCB9] shadow-2xl my-auto">
        {/* Title Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#EADCB9] pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              PHASE 1 · CALIBRATION
            </span>
            <h1 className="text-xl font-black text-[#1E2544] tracking-tight mt-1">
              Set up your mock interview
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 max-w-sm text-right hidden sm:block">
            Gemini 2.5 Flash will ground questions in your experience.
          </p>
        </div>

        {/* 2-Column Form Layout */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Target Role & Resume Upload */}
          <div className="flex flex-col gap-4">
            {/* Target Role & Presets */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Target Role <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setRole(preset)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      role === preset
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                id="role"
                required
                placeholder="Or type custom role title (e.g. Senior Architect)..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            {/* Seniority Level & Question Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Seniority Level */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Seniority Level
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  {(["entry", "mid", "senior"] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`py-1.5 text-xs font-black capitalize rounded-lg transition ${
                        difficulty === lvl
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      {lvl === "entry" ? "Entry" : lvl === "mid" ? "Mid" : "Senior"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Volume */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Question Volume
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  {[3, 5, 8].map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`py-1.5 text-xs font-black rounded-lg transition ${
                        questionCount === count
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Upload Dropzone */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Resume PDF Upload
                </label>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  AI Grounding Enabled
                </span>
              </div>

              <div className="relative my-2 flex-1 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500/50 p-4 text-center transition bg-slate-50/50 hover:bg-blue-50/20 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {file ? file.name : "Drop PDF resume here or click to browse"}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">PDF documents up to 10MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis Preview & Action */}
          <div className="flex flex-col justify-between gap-3 min-h-0">
            {/* Status / Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Session Configuration
                </h3>

                <div className="space-y-2 text-xs font-semibold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Target Role:</span>
                    <span className="font-extrabold text-blue-600">{role || "Not specified"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Seniority Level:</span>
                    <span className="font-extrabold text-indigo-600 capitalize">{difficulty} Level</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Questions:</span>
                    <span className="font-extrabold text-slate-900">{questionCount} Dynamic Scenarios</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Vector Store:</span>
                    <span className="font-extrabold text-emerald-600">
                      {resumeResult ? "Resume Indexed" : "Standard Domain Corpus"}
                    </span>
                  </div>
                </div>
              </div>

              {indexingProgress && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold mt-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  <span>{indexingProgress}</span>
                </div>
              )}

              {resumeResult && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resume indexed into vector store</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-black">
                    {resumeResult.extractedChars} chars
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 mt-2">
                  {error}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={startingSession || uploadingResume}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 font-black text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {startingSession ? (
                <span>Generating Gemini Interview Questions...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
