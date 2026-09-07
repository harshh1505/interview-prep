import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink-950">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-sans text-sm tracking-wide text-chalk-200/60">
          Practice out loud, before it counts.
        </p>
        <h1 className="mt-4 max-w-prose font-serif text-5xl font-semibold leading-[1.1] text-chalk-50 sm:text-6xl">
          Say it here first.
        </h1>
        <p className="mt-6 max-w-prose font-sans text-lg leading-relaxed text-chalk-200/80">
          Rehearsal runs you through role-specific mock interviews, listens to how you answer,
          and tells you — plainly — what to fix before the real thing.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/upload"
            className="rounded-none border border-amber-500 bg-amber-500 px-6 py-3 font-sans text-sm font-medium text-ink-950 transition hover:bg-amber-600 hover:border-amber-600"
          >
            Start a mock interview
          </Link>
          <Link
            href="/dashboard"
            className="rounded-none border border-chalk-200/30 px-6 py-3 font-sans text-sm font-medium text-chalk-100 transition hover:border-chalk-200/60"
          >
            View past sessions
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-px overflow-hidden border border-chalk-200/10 sm:grid-cols-3">
          {[
            {
              label: "Questions",
              body: "Generated for your target role, and your resume when you share one — not a generic bank.",
            },
            {
              label: "Feedback",
              body: "Every answer gets a score, named strengths, and one thing to change next time.",
            },
            {
              label: "History",
              body: "Track how your scores move across sessions, not just how the last one went.",
            },
          ].map((item) => (
            <div key={item.label} className="bg-ink-900 p-6">
              <h2 className="font-serif text-lg text-chalk-50">{item.label}</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-chalk-200/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
