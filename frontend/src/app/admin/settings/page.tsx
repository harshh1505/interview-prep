"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Users,
  Building,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Upload,
  Trash2,
  RotateCcw,
  Ban,
  Activity,
  ShieldAlert,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "access" | "platform" | "security">("general");

  // Real Settings State
  const [platformName, setPlatformName] = useState("PrepPilot");
  const [platformDescription, setPlatformDescription] = useState("AI-powered interview preparation and skill assessment platform.");
  const [primaryColor, setPrimaryColor] = useState("#F97316");
  const [registrationStatus, setRegistrationStatus] = useState<"enabled" | "invite" | "disabled">("enabled");
  const [roleManagement, setRoleManagement] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Stats from backend API
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalAssessments: number;
    totalPrograms: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  // Modals
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  async function fetchSettingsAndStats() {
    try {
      const [setRes, statRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/stats"),
      ]);

      const setData = await setRes.json();
      if (setData.success && setData.settings) {
        setPlatformName(setData.settings.platformName || "PrepPilot");
        setRegistrationStatus(setData.settings.registrationStatus || "enabled");
        setMaintenanceMode(Boolean(setData.settings.maintenanceMode));
        if (setData.settings.roleManagementEnabled !== undefined) {
          setRoleManagement(Boolean(setData.settings.roleManagementEnabled));
        }
      }

      const statData = await statRes.json();
      if (statData.success && statData.stats) {
        setStats({
          totalUsers: statData.stats.totalUsers || 0,
          activeUsers: statData.stats.activeUsers || 0,
          totalAssessments: statData.stats.totalAssessments || 0,
          totalPrograms: statData.stats.totalPrograms || 0,
        });
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.warn("Error fetching settings/stats:", err);
    }
  }

  useEffect(() => {
    fetchSettingsAndStats();
  }, []);

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName,
          platformDescription,
          primaryColor,
          registrationStatus,
          roleManagementEnabled: roleManagement,
          maintenanceMode,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "Platform settings updated and logged to audit trail." });
      } else {
        setMessage({ type: "error", text: json.error || "Failed to update platform settings." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while saving settings." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisablePlatformConfirm() {
    setActionProcessing(true);
    try {
      const newMaint = !maintenanceMode;
      setMaintenanceMode(newMaint);
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: newMaint }),
      });
      setShowDisableModal(false);
      setMessage({ type: "success", text: `Platform maintenance mode set to ${newMaint ? "Active" : "Disabled"}.` });
    } catch {
      setMessage({ type: "error", text: "Could not update platform state." });
    } finally {
      setActionProcessing(false);
    }
  }

  async function handleResetSettingsConfirm() {
    setActionProcessing(true);
    try {
      setPlatformName("PrepPilot");
      setPlatformDescription("AI-powered interview preparation and skill assessment platform.");
      setRegistrationStatus("enabled");
      setRoleManagement(true);
      setMaintenanceMode(false);
      setPrimaryColor("#F97316");

      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: "PrepPilot",
          registrationStatus: "enabled",
          maintenanceMode: false,
          roleManagementEnabled: true,
        }),
      });
      setShowResetModal(false);
      setMessage({ type: "success", text: "All platform settings reset to system defaults." });
    } catch {
      setMessage({ type: "error", text: "Error resetting settings." });
    } finally {
      setActionProcessing(false);
    }
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col gap-6 font-sans">
      {/* Page Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#1E2544] tracking-tight">Platform Settings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Manage your platform configuration, access controls, and system preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition ${
              activeTab === "general"
                ? "bg-white text-[#F97316] shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab("access")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition ${
              activeTab === "access"
                ? "bg-white text-[#F97316] shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User & Access</span>
          </button>
          <button
            onClick={() => setActiveTab("platform")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition ${
              activeTab === "platform"
                ? "bg-white text-[#F97316] shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Platform</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition ${
              activeTab === "security"
                ? "bg-white text-[#F97316] shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`shrink-0 rounded-xl p-3 text-xs font-bold border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Console Viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Left Column: Form Sections (2 Cols width) */}
        <div className="lg:col-span-2 overflow-y-auto space-y-4 pr-1">
          {/* Section 1: Platform Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-[#1E2544]">Platform Identity</h2>
                <p className="text-[11px] font-semibold text-slate-400">Configure basic branding across PrepPilot.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#F97316] focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Platform Description</label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {platformDescription.length}/200
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={platformDescription}
                  onChange={(e) => setPlatformDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-[#F97316] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Platform Appearance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-[#1E2544]">Platform Appearance</h2>
                <p className="text-[11px] font-semibold text-slate-400">Customize logo and primary accent color.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Platform Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <button className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Change</span>
                      </button>
                      <button className="px-2 py-1 bg-red-50 border border-red-100 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-100 transition flex items-center gap-1">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                    <p className="text-[9px] font-semibold text-slate-400">PNG, JPG or SVG (max 2MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F97316] border border-slate-300 shadow-xs" />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-28 rounded-xl border border-slate-200 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: User Registration & Access */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-[#1E2544]">User Registration & Access</h2>
                <p className="text-[11px] font-semibold text-slate-400">Control how users register and access PrepPilot.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">New User Registration</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Enabled */}
                <button
                  type="button"
                  onClick={() => setRegistrationStatus("enabled")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    registrationStatus === "enabled"
                      ? "border-[#F97316] bg-amber-500/5 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-extrabold text-slate-900">Enabled</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${registrationStatus === "enabled" ? "border-[#F97316] bg-[#F97316]" : "border-slate-300"}`} />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500">Public registration allowed</p>
                </button>

                {/* Invite Only */}
                <button
                  type="button"
                  onClick={() => setRegistrationStatus("invite")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    registrationStatus === "invite"
                      ? "border-[#F97316] bg-amber-500/5 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-extrabold text-slate-900">Invite Only</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${registrationStatus === "invite" ? "border-[#F97316] bg-[#F97316]" : "border-slate-300"}`} />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500">Users require invitation</p>
                </button>

                {/* Disabled */}
                <button
                  type="button"
                  onClick={() => setRegistrationStatus("disabled")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    registrationStatus === "disabled"
                      ? "border-[#F97316] bg-amber-500/5 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-extrabold text-slate-900">Disabled</span>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${registrationStatus === "disabled" ? "border-[#F97316] bg-[#F97316]" : "border-slate-300"}`} />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500">New registrations blocked</p>
                </button>
              </div>

              {/* Role Promotion Toggle Component */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Role Promotion Controls</span>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Allow administrators to promote users to admin from User Detail panel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleManagement(!roleManagement)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    roleManagement ? "bg-[#F97316]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      roleManagement ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Mode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-extrabold text-[#1E2544]">Maintenance Mode</h2>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                    maintenanceMode
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                  }`}
                >
                  {maintenanceMode ? "🔴 Active" : "🟢 Currently inactive"}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Temporarily restrict normal user access while keeping administrator access operational.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                maintenanceMode ? "bg-red-500" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  maintenanceMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Section 5: Danger Zone */}
          <div className="bg-red-50/40 rounded-2xl border border-red-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-black uppercase tracking-wider">Danger Zone</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-red-100 p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Disable Platform</h4>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                    Temporarily prevent normal users from accessing PrepPilot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisableModal(true)}
                  className="mt-3 w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Disable Platform</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-red-100 p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Reset Platform Settings</h4>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                    Restore all configuration to defaults. Action logged in audit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="mt-3 w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary Save Action */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-black shadow-md transition disabled:opacity-50"
            >
              {saving ? "Saving Configuration…" : "Save Platform Settings"}
            </button>
          </div>
        </div>

        {/* Right Column: Real Secondary Status & Quick Actions Panel */}
        <div className="space-y-4 overflow-y-auto">
          {/* Card 1: Platform Operational Status & Real DB Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-[#1E2544] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Platform Status</span>
              </h3>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operational</span>
              </span>
            </div>

            {/* Real Stats List fetched from API */}
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Total Users</span>
                <span className="font-extrabold text-slate-900">
                  {stats ? stats.totalUsers.toLocaleString() : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Active Users (30d)</span>
                <span className="font-extrabold text-slate-900">
                  {stats ? stats.activeUsers.toLocaleString() : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Interviews Conducted</span>
                <span className="font-extrabold text-indigo-600">
                  {stats ? stats.totalAssessments.toLocaleString() : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500">Active Programs</span>
                <span className="font-extrabold text-emerald-600">
                  {stats ? stats.totalPrograms.toLocaleString() : "—"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Updated: {lastUpdated}</span>
              <button
                onClick={fetchSettingsAndStats}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black text-[#1E2544] uppercase tracking-wider">Quick Actions</h3>

            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">View User Directory</h4>
                  <p className="text-[10px] font-semibold text-slate-400">Manage user roles and candidates</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/system"
                className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">System Health</h4>
                  <p className="text-[10px] font-semibold text-slate-400">Inspect Supabase & Gemini status</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/audit-logs"
                className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">View Audit Logs</h4>
                  <p className="text-[10px] font-semibold text-slate-400">Inspect system audit trail</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Card 3: Need Help / Documentation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-[#1E2544]">Need Help?</h3>
            <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
              Check our system documentation or view admin logs for assistance with configuration.
            </p>
            <a
              href="/admin/reports"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline"
            >
              <span>View System Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Confirmation Modal 1: Disable Platform */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Confirm Platform Status Change</h3>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Are you sure you want to toggle <strong>Platform Maintenance Mode</strong>? When active, normal candidates cannot access mock interviews while administrators remain operational.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDisableModal(false)}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisablePlatformConfirm}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
              >
                {actionProcessing ? "Updating…" : "Confirm State Toggle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 2: Reset Settings */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Reset Platform Settings</h3>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Are you sure you want to restore default platform settings? This will reset the platform name, registration policy, and primary color accent.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSettingsConfirm}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
              >
                {actionProcessing ? "Resetting…" : "Confirm Reset Defaults"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
