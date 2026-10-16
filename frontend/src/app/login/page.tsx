"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Eye, EyeOff, ArrowLeft, Laptop, Clock, CheckCircle, Sparkles } from "lucide-react";

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to sign in.");
      }

      if (data.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2A3256] p-4 py-6 sm:py-10 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-4xl min-h-[500px] my-auto flex flex-col justify-between">
        {/* Back Link */}
        <Link
          href="/role-selection"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-[#FEF9EF] hover:text-[#FFB800] mb-3 transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to role selection
        </Link>

        {/* Split Frame Container */}
        <div className="flex-1 bg-white rounded-[32px] border-4 border-[#EADCB9] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Side: Illustration Panel */}
          <div className="bg-[#F0F5FF] p-8 flex flex-col justify-between items-center text-center relative border-r border-[#E2ECFF]">
            <div className="w-full text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[#2563EB] uppercase bg-white px-3 py-1 rounded-full border border-blue-200 shadow-xs">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                USER LOGIN
              </span>
            </div>

            {/* Illustration Graphic Box */}
            <div className="my-auto py-2 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#FFB800]/20 flex items-center justify-center mb-3">
                  <div className="w-22 h-22 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Laptop className="w-10 h-10" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-white rounded-2xl p-2 shadow-md border border-blue-100">
                  <Clock className="w-4 h-4 text-[#FFB800]" />
                </div>
                <div className="absolute -bottom-1 -left-1 bg-white rounded-2xl p-2 shadow-md border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              <h2 className="text-lg font-black text-[#1E2544] mt-1">Practice AI Resume Interviews</h2>
              <p className="text-[11px] font-semibold text-[#64748B] max-w-xs mt-0.5 leading-relaxed">
                Simulate real technical interviews customized directly to your uploaded resume.
              </p>
            </div>

            <div className="text-[11px] font-extrabold text-[#36416B]">
              Trusted by 1,000+ candidates
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="p-6 sm:p-8 bg-white flex flex-col justify-center">
            <div className="mb-4">
              <h1 className="text-2xl font-black text-[#1E2544]">Student Login</h1>
              <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">
                Hey enter your details to sign in to your account
              </p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#1E2544] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#1E2544]">
                    Password
                  </label>
                  <a href="#forgot" className="text-[11px] font-bold text-[#2563EB] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-900 font-semibold placeholder-gray-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-2.5 font-extrabold text-xs text-white shadow-md transition disabled:opacity-50 mt-1"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-4 text-center text-xs font-semibold text-[#64748B]">
              Don't have account?{" "}
              <Link href="/signup" className="font-extrabold text-[#2563EB] hover:underline">
                Create new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
