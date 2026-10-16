"use client";

import { useState, useEffect } from "react";
import { Plus, Sparkles, BookOpen, Layers, CheckCircle2 } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: "active" | "inactive" | "draft";
  enrolledCount?: number;
  completionRate?: number;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Form modal to create program
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("Software Engineering");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchPrograms() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/programs");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load programs.");
        setPrograms([]);
        setLoading(false);
        return;
      }
      setPrograms(json.programs || []);
    } catch (err: any) {
      setError("Network error fetching programs.");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  async function handleCreateProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, domain, description, status: "active" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setTitle("");
        setDescription("");
        fetchPrograms();
      } else {
        alert(json.error || "Failed to create program.");
      }
    } catch {
      alert("Error creating program.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedTracks() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchPrograms();
      } else {
        alert(json.error || "Failed to seed tracks.");
      }
    } catch {
      alert("Network error seeding tracks.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Program & Track Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Manage learning domains, interview tracks, and candidate enrollments in Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {programs.length === 0 && !loading && (
            <button
              type="button"
              onClick={handleSeedTracks}
              disabled={seeding}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-bold text-xs text-indigo-700 hover:bg-indigo-100 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{seeding ? "Seeding…" : "Seed Standard Tracks"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-indigo-600 px-3 py-1.5 font-bold text-xs text-white hover:bg-indigo-700 transition shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Program</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 shrink-0">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex-1 rounded-2xl border border-dashed border-slate-300 bg-white p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">No Learning Programs in Database</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are currently 0 programs in your Supabase database. You can create a custom program or seed the standard tracks.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSeedTracks}
              disabled={seeding}
              className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-100 transition"
            >
              {seeding ? "Seeding…" : "Seed 4 Standard Tracks into DB"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition"
            >
              Create Program
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {programs.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {p.domain}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black capitalize ${
                      p.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  {p.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Enrolled: <strong className="text-slate-900 font-extrabold">{p.enrolledCount ?? 0}</strong> candidates</span>
                <span>Avg Rate: <strong className="text-indigo-600 font-extrabold">{p.completionRate ?? 0}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 font-sans">
            <h2 className="text-lg font-black text-slate-900">
              Create New Learning Program
            </h2>
            <form onSubmit={handleCreateProgram} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Microservices"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Domain</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Backend Architecture"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of program modules and focus areas…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
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

