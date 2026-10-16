"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("Platform Operations");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdminSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName, department },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          target_role: department,
          role: "admin",
        });

        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register administrator account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2A3256] p-3 sm:p-4 py-6 sm:py-10 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-4xl min-h-[540px] my-auto flex flex-col justify-between">
        {/* Back Link */}
        <div className="shrink-0 mb-2">
          <Link
            href="/role-selection"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FEF9EF] hover:text-[#FFB800] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to role selection
          </Link>
        </div>

        {/* Split Frame Container */}
        <div className="flex-1 bg-white rounded-3xl border-4 border-[#EADCB9] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Side: Soft Orange Illustration Panel */}
          <div className="bg-[#FFF7ED] p-6 sm:p-8 flex flex-col justify-between items-center text-center relative border-r border-[#FFEDD5]">
            <div className="w-full text-left shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-[#F97316] uppercase bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shadow-xs">
                <Shield className="w-3 h-3 text-[#F97316]" />
                ADMIN REGISTRATION
              </span>
            </div>

            {/* Compact Graphic Icon Box */}
            <div className="my-auto py-2 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F97316] text-white flex items-center justify-center mb-3 shadow-md shadow-[#F97316]/30">
                <Shield className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-lg font-black text-[#1E2544] tracking-tight">Platform Control Portal</h2>
              <p className="text-xs font-semibold text-[#64748B] max-w-xs mt-1 leading-relaxed">
                Register an administrator account with full control panel access and audit logging.
              </p>
            </div>

            <div className="text-[11px] font-extrabold text-[#36416B] shrink-0">
              Authorized Personnel Only
            </div>
          </div>

          {/* Right Side: Compact Form Panel */}
          <div className="p-6 sm:p-8 bg-white flex flex-col justify-center">
            <div className="mb-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1E2544] tracking-tight whitespace-nowrap">
                Register Admin Account
              </h1>
              <p className="text-xs font-semibold text-[#64748B] mt-0.5">
                Role is strictly configured as Administrator (`role = admin`)
              </p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleAdminSignup} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E2544] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Admin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#F97316] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E2544] mb-1">
                  Department / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platform Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#F97316] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E2544] mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#F97316] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#1E2544] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#F97316] focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#F97316] hover:bg-[#EA580C] py-2.5 font-extrabold text-xs text-white shadow-md transition disabled:opacity-50 mt-1"
              >
                {loading ? "Registering Admin..." : "Register Admin Account →"}
              </button>
            </form>

            <div className="mt-3 text-center text-xs font-semibold text-[#64748B]">
              Already registered?{" "}
              <Link href="/admin/login" className="font-extrabold text-[#F97316] hover:underline">
                Sign in to Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
