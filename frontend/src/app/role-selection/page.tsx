"use client";

import Link from "next/link";
import { User, Settings, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-[#2A3256] p-3 sm:p-5 py-6 sm:py-10 flex flex-col justify-center items-center font-sans selection:bg-[#FFB800] selection:text-[#1E2544]">
      {/* Outer Framed Warm Cream Container */}
      <div className="w-full max-w-5xl min-h-[540px] bg-[#FEF9EF] rounded-[32px] border-4 border-[#EADCB9] p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden my-auto">
        {/* Background Blob Accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFB800]/15 rounded-bl-full pointer-events-none blur-xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#2563EB]/10 rounded-tr-full pointer-events-none blur-xl" />

        {/* Top Header */}
        <header className="flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 text-[#1E2544] hover:text-[#F97316] transition mr-2">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="w-9 h-9 rounded-2xl bg-[#FFB800] flex items-center justify-center text-[#1E2544] font-black shadow-md shadow-[#FFB800]/40">
              <Sparkles className="w-4 h-4 text-[#1E2544]" />
            </div>
            <span className="font-black text-xl tracking-tight text-[#1E2544]">PrepPilot</span>
          </div>
          <Link
            href="/"
            className="text-xs font-extrabold text-[#36416B] hover:text-[#1E2544] bg-white/80 border border-[#EADCB9] px-3.5 py-1.5 rounded-xl transition shadow-xs"
          >
            ← Home
          </Link>
        </header>

        {/* Center Content Area */}
        <main className="z-10 text-center max-w-3xl mx-auto my-auto flex flex-col items-center justify-center py-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-widest text-[#1E2544] uppercase mb-2.5 bg-[#FFB800] px-3.5 py-1 rounded-full shadow-xs">
            <Sparkles className="w-3 h-3" />
            WELCOME TO PREPPILOT
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E2544] tracking-tight mb-2 leading-tight">
            Choose how you use the platform
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#475569] max-w-md mx-auto mb-6">
            Select your role to access a tailored experience
          </p>

          {/* 2 Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left w-full">
            {/* User Card */}
            <Link
              href="/login"
              className="group bg-white rounded-3xl border-2 border-[#F3E8D3] hover:border-[#FFB800] p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[220px] max-h-[250px] relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFB800] text-[#1E2544] flex items-center justify-center mb-4 shadow-md shadow-[#FFB800]/40 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-[#1E2544] mb-1">User</h2>
                <p className="text-xs font-semibold text-[#475569] leading-relaxed line-clamp-2">
                  Learn, practice, and track your personalized journey with AI resume interview prep.
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F3E8D3]">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1E2544] group-hover:text-[#2563EB] transition-colors">
                  Enter User Portal
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#1E2544] text-white flex items-center justify-center shadow-md group-hover:bg-[#2563EB] group-hover:scale-105 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Admin Card */}
            <Link
              href="/admin/login"
              className="group bg-white rounded-3xl border-2 border-[#F3E8D3] hover:border-[#F97316] p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[220px] max-h-[250px] relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center mb-4 shadow-md shadow-[#F97316]/40 group-hover:scale-105 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-[#1E2544] mb-1">Admin</h2>
                <p className="text-xs font-semibold text-[#475569] leading-relaxed line-clamp-2">
                  Manage users, content, programs, system health, and platform operations.
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F3E8D3]">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1E2544] group-hover:text-[#F97316] transition-colors">
                  Enter Admin Portal
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#1E2544] text-white flex items-center justify-center shadow-md group-hover:bg-[#F97316] group-hover:scale-105 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="z-10 text-center text-[11px] font-bold text-[#64748B] shrink-0">
          © 2026 PrepPilot. Powered by Google Gemini 2.5 & Pinecone Vector DB.
        </footer>
      </div>
    </div>
  );
}
