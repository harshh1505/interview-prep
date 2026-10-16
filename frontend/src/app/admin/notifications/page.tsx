"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("system");
  const [saving, setSaving] = useState(false);

  async function fetchNotifs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) setNotifs(json.notifications || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifs();
  }, []);

  async function handleCreateNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, category }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowModal(false);
        setTitle("");
        setMessage("");
        fetchNotifs();
      } else {
        alert(json.error || "Failed to post notification.");
      }
    } catch {
      alert("Error posting notification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Admin Notifications Hub
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            System alerts, security notifications, platform updates, and announcements in Supabase.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 font-bold text-xs text-white hover:bg-indigo-700 transition shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Notification</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl p-4" />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex-1 rounded-2xl border border-dashed border-slate-300 bg-white p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">No Notifications in Database</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are currently 0 notifications recorded in Supabase. You can create a new notification or announcement for administrators.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition"
          >
            Create Notification
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {notifs.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-start justify-between gap-3 hover:border-indigo-200 transition"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {n.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xs font-extrabold text-slate-900">{n.title}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 font-sans text-xs">
            <h2 className="text-lg font-black text-slate-900">Create Admin Notification</h2>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Platform Maintenance"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600 font-bold"
                >
                  <option value="system">System Alert</option>
                  <option value="announcement">Announcement</option>
                  <option value="assessment">Assessment</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details of the announcement or system event…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Posting…" : "Post to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

