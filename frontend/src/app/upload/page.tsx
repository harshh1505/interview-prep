"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession, uploadResume } from "@/lib/api";

// TODO: replace with the authenticated user's id from Supabase Auth once
// sign-in is wired up. For local development this can be any UUID that
// already exists in `profiles` (see supabase/schema.sql).
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function UploadPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [domain, setDomain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim()) {
      setError("Enter the role you're preparing for.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let useResume = false;
      if (file) {
        await uploadResume(DEV_USER_ID, file);
        useResume = true;
      }
      const { session } = await createSession({ userId: DEV_USER_ID, role, domain: domain || undefined, useResume });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting the session. Check the API is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink-950">
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-serif text-3xl text-chalk-50">Set up your session</h1>
        <p className="mt-2 font-sans text-sm text-chalk-200/70">
          Tell us the role. Attach a resume if you want questions tailored to it.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="block font-sans text-sm text-chalk-200/80" htmlFor="role">
              Target role
            </label>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Engineer Intern"
              className="mt-2 w-full border border-chalk-200/20 bg-ink-900 px-4 py-3 font-sans text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-sans text-sm text-chalk-200/80" htmlFor="domain">
              Domain <span className="text-chalk-200/40">(optional)</span>
            </label>
            <input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Full stack, GenAI"
              className="mt-2 w-full border border-chalk-200/20 bg-ink-900 px-4 py-3 font-sans text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-sans text-sm text-chalk-200/80" htmlFor="resume">
              Resume <span className="text-chalk-200/40">(PDF, optional)</span>
            </label>
            <input
              id="resume"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 w-full font-sans text-sm text-chalk-200/70 file:mr-4 file:border-0 file:bg-chalk-200/10 file:px-4 file:py-2 file:text-chalk-50"
            />
          </div>

          {error && <p className="font-sans text-sm text-clay-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-amber-500 bg-amber-500 px-6 py-3 font-sans text-sm font-medium text-ink-950 transition hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50"
          >
            {loading ? "Generating questions…" : "Begin interview"}
          </button>
        </form>
      </div>
    </main>
  );
}
