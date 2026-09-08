import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100 selection:bg-amber-500 selection:text-ink-950">
      {/* Top Header */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-serif text-xl tracking-tight text-chalk-50">
            Rehearsal <span className="text-xs font-sans font-normal tracking-wide text-amber-500 uppercase px-2 py-0.5 border border-amber-500/30 rounded-full ml-2">Gemini + Pinecone</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-sans text-xs text-chalk-200/70 hover:text-chalk-50 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="rounded border border-amber-500 bg-amber-500 px-4 py-2 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400 transition"
            >
              Start Session →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-sans text-amber-400 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Powered by Google Gemini 2.5 & Pinecone Vector Search
        </div>

        <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.1] text-chalk-50 sm:text-6xl lg:text-7xl">
          Say it here first, <br />
          <span className="italic text-amber-400">before it counts.</span>
        </h1>

        <p className="mt-8 max-w-2xl font-sans text-lg leading-relaxed text-chalk-200/80">
          Rehearsal chunks your resume into vector embeddings on Pinecone, generates deeply tailored technical and
          behavioral interview questions with Google Gemini, and listens to your spoken answers to provide actionable,
          executive-level feedback.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/upload"
            className="rounded border border-amber-500 bg-amber-500 px-7 py-3.5 font-sans text-sm font-semibold text-ink-950 transition hover:bg-amber-400 hover:border-amber-400 shadow-lg shadow-amber-500/15"
          >
            Upload Resume & Start Practice →
          </Link>
          <Link
            href="/dashboard"
            className="rounded border border-chalk-200/20 bg-ink-900 px-6 py-3.5 font-sans text-sm font-medium text-chalk-100 transition hover:border-chalk-200/50"
          >
            Review Past Sessions
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-chalk-200/10 bg-ink-900/60 p-6 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-500/10 text-amber-400 font-serif text-lg font-bold border border-amber-500/20">
              01
            </div>
            <h2 className="mt-4 font-serif text-lg text-chalk-50">Pinecone Semantic Chunking</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-chalk-200/70">
              Your resume PDF is split into section-aware chunks (Experience, Projects, Skills) and indexed as 768-dim
              vectors to ground every question in your actual work.
            </p>
          </div>

          <div className="rounded-lg border border-chalk-200/10 bg-ink-900/60 p-6 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-moss-500/10 text-moss-400 font-serif text-lg font-bold border border-moss-500/20">
              02
            </div>
            <h2 className="mt-4 font-serif text-lg text-chalk-50">Gemini Role Reasoning</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-chalk-200/70">
              Google Gemini probes real system trade-offs, architecture decisions, and metrics straight from your resume
              instead of repeating generic question banks.
            </p>
          </div>

          <div className="rounded-lg border border-chalk-200/10 bg-ink-900/60 p-6 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-clay-500/10 text-clay-400 font-serif text-lg font-bold border border-clay-500/20">
              03
            </div>
            <h2 className="mt-4 font-serif text-lg text-chalk-50">Voice Dictation & Feedback</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-chalk-200/70">
              Speak out loud with real-time browser speech recognition. Receive a 0–100 score, specific strengths,
              weaknesses, and an exemplar model answer.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
