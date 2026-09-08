"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkApiHealth, createSession, uploadResume, type ApiHealth, type ResumeUploadResult } from "@/lib/api";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

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
    checkApiHealth()
      .then(setHealth)
      .catch((err) => console.warn("API health check:", err));
  }, []);

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
      setTimeout(() => setIndexingProgress("Generating 768-dim embeddings via Gemini text-embedding-004..."), 1200);
      setTimeout(() => setIndexingProgress("Upserting vectors into Pinecone database..."), 2000);

      const result = await uploadResume(DEV_USER_ID, selectedFile);
      setResumeResult(result);
      setIndexingProgress(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse and chunk resume onto Pinecone.");
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
        userId: DEV_USER_ID,
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
          : "Could not generate interview questions. Verify backend is running and GEMINI_API_KEY is configured in backend/.env"
      );
    } finally {
      setStartingSession(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100">
      {/* Top Navigation */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl tracking-tight text-chalk-50 hover:text-amber-500 transition">
            Rehearsal <span className="text-xs font-sans font-normal tracking-wide text-amber-500 uppercase px-2 py-0.5 border border-amber-500/30 rounded-full ml-2">Gemini + Pinecone</span>
          </Link>
          <div className="flex items-center gap-6 font-sans text-xs">
            <Link href="/dashboard" className="text-chalk-200/70 hover:text-chalk-50 transition">
              Past Sessions
            </Link>
            {health && (
              <span className="flex items-center gap-2 text-chalk-200/50">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    health.services.gemini === "configured" ? "bg-moss-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                Gemini: {health.services.gemini === "configured" ? "Active" : "Key Needed in .env"}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="border-b border-chalk-200/10 pb-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-amber-500">
            Phase 1 · Session Calibration
          </p>
          <h1 className="mt-2 font-serif text-3xl text-chalk-50">Set up your mock interview</h1>
          <p className="mt-2 font-sans text-sm text-chalk-200/70 leading-relaxed">
            Upload your resume to chunk and index it in Pinecone. Google Gemini will probe your specific projects,
            technologies, and architectural decisions.
          </p>
        </div>

        {health && health.services.gemini === "missing_key" && (
          <div className="mt-6 rounded border border-amber-500/30 bg-amber-500/10 p-4 font-sans text-xs text-amber-200">
            <p className="font-semibold text-amber-400">Notice: Gemini API Key Not Yet Configured</p>
            <p className="mt-1 text-chalk-200/80">
              Add your <code className="bg-ink-900 px-1.5 py-0.5 text-amber-300">GEMINI_API_KEY</code> to{" "}
              <code className="bg-ink-900 px-1.5 py-0.5 text-amber-300">backend/.env</code> to generate real Gemini questions
              and evaluations.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Target Role & Presets */}
          <div>
            <label className="block font-sans text-sm font-medium text-chalk-100" htmlFor="role">
              Target Role <span className="text-amber-500">*</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setRole(preset)}
                  className={`rounded-full px-3 py-1 font-sans text-xs transition ${
                    role === preset
                      ? "bg-amber-500 text-ink-950 font-semibold"
                      : "border border-chalk-200/20 bg-ink-900 text-chalk-200/70 hover:border-amber-500/50 hover:text-chalk-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Distributed Systems Engineer"
              className="mt-3 w-full border border-chalk-200/20 bg-ink-900 px-4 py-3 font-sans text-sm text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Domain / Specialization */}
          <div>
            <label className="block font-sans text-sm font-medium text-chalk-100" htmlFor="domain">
              Domain Focus <span className="text-chalk-200/40 text-xs font-normal">(Optional)</span>
            </label>
            <input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. High-throughput Kafka, Microservices, RAG Pipelines"
              className="mt-2 w-full border border-chalk-200/20 bg-ink-900 px-4 py-3 font-sans text-sm text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Experience Level & Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-chalk-100">Seniority Level</label>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded border border-chalk-200/20 bg-ink-900 p-1">
                {(["entry", "mid", "senior"] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-center font-sans text-xs capitalize transition rounded ${
                      difficulty === lvl
                        ? "bg-amber-500 font-semibold text-ink-950"
                        : "text-chalk-200/70 hover:text-chalk-50"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-chalk-100">Question Volume</label>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded border border-chalk-200/20 bg-ink-900 p-1">
                {[3, 5, 8].map((count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 text-center font-sans text-xs transition rounded ${
                      questionCount === count
                        ? "bg-amber-500 font-semibold text-ink-950"
                        : "text-chalk-200/70 hover:text-chalk-50"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resume Upload & Pinecone Chunking Box */}
          <div className="border border-chalk-200/20 bg-ink-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-sans text-sm font-semibold text-chalk-50" htmlFor="resume">
                  Candidate Resume
                </label>
                <p className="mt-1 font-sans text-xs text-chalk-200/60">
                  Upload PDF to chunk into sections and index vectors in Pinecone.
                </p>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-1 font-sans text-[11px] font-medium text-amber-400 border border-amber-500/20">
                Pinecone Vector RAG
              </span>
            </div>

            <div className="mt-4">
              <input
                id="resume"
                type="file"
                accept="application/pdf"
                disabled={uploadingResume}
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="w-full font-sans text-sm text-chalk-200/70 file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-amber-500 file:px-4 file:py-2.5 file:font-sans file:text-xs file:font-semibold file:text-ink-950 hover:file:bg-amber-400"
              />
            </div>

            {/* Indexing state feedback */}
            {uploadingResume && (
              <div className="mt-4 space-y-2 rounded border border-amber-500/30 bg-ink-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <span className="font-sans text-xs font-medium text-amber-400">{indexingProgress}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full w-2/3 animate-pulse bg-amber-500" />
                </div>
              </div>
            )}

            {/* Successful indexing details */}
            {resumeResult && !uploadingResume && (
              <div className="mt-4 rounded border border-moss-500/30 bg-moss-500/10 p-4 font-sans text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-moss-400">✓ Resume Chunked & Indexed</span>
                  <span className="text-[11px] text-chalk-200/60 uppercase">
                    Storage: {resumeResult.storage === "pinecone" ? "Pinecone Serverless" : "Local Vector Memory"}
                  </span>
                </div>
                <p className="mt-1 text-chalk-200/80">
                  Extracted {resumeResult.extractedChars.toLocaleString()} characters into{" "}
                  <strong className="text-chalk-50">{resumeResult.chunkCount} semantic chunks</strong> across sections:{" "}
                  <span className="text-amber-300">{resumeResult.sections.join(", ")}</span>.
                </p>
                {resumeResult.sampleChunks.length > 0 && (
                  <div className="mt-2 border-t border-moss-500/20 pt-2 text-[11px] text-chalk-200/60">
                    <span className="font-mono text-chalk-200/40">Sample chunk: </span>
                    {resumeResult.sampleChunks[0].slice(0, 140)}...
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded border border-clay-500/30 bg-clay-500/10 p-4 font-sans text-xs text-clay-400">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={startingSession || uploadingResume}
            className="w-full rounded border border-amber-500 bg-amber-500 py-3.5 font-sans text-sm font-semibold text-ink-950 transition hover:bg-amber-400 hover:border-amber-400 disabled:opacity-50 shadow-lg shadow-amber-500/10"
          >
            {startingSession
              ? "Querying Pinecone & Prompting Gemini…"
              : resumeResult
              ? "Begin Interview with Resume Grounding"
              : "Begin Standard Mock Interview"}
          </button>
        </form>
      </div>
    </main>
  );
}
