"use client";

import Link from "next/link";
import {
  Sparkles,
  Upload,
  MessageSquareText,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle2,
  FileText,
  Target,
  Brain,
  Layers,
  Mic,
  ShieldCheck,
  User,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FEF9EF] text-slate-900 font-sans selection:bg-[#FFB800] selection:text-[#1E2544]">
      {/* ============================================================ */}
      {/* 1. STICKY TOP HEADER                                         */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#FEF9EF]/90 backdrop-blur-md border-b border-[#EADCB9]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFB800] flex items-center justify-center text-[#1E2544] font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-[#1E2544]" />
            </div>
            <span className="font-black text-lg tracking-tight text-[#1E2544]">PrepPilot</span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-[#36416B]">
            <a href="#how-it-works" className="hover:text-[#F97316] transition">
              How it works
            </a>
            <a href="#features" className="hover:text-[#F97316] transition">
              Features
            </a>
            <a href="#about" className="hover:text-[#F97316] transition">
              About
            </a>
          </nav>

          {/* Sign In CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/role-selection"
              className="text-xs font-extrabold text-[#1E2544] bg-white border border-[#EADCB9] px-4 py-2 rounded-xl hover:border-[#FFB800] hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION WITH BALANCED TWO-COLUMN MOCKUP               */}
      {/* ============================================================ */}
      <section className="relative pt-6 pb-12">
        {/* Soft Background Accents */}
        <div className="absolute top-10 left-1/3 w-72 h-72 bg-[#FFB800]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Content (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-5 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFB800]/20 border border-[#FFB800]/40 text-[#1E2544] text-[11px] font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>AI-Powered Interview Preparation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-[#1E2544] tracking-tight leading-[1.15]">
              Prepare smarter.
              <br />
              Interview with <span className="text-[#F97316] underline decoration-[#FFB800] decoration-wavy decoration-2">confidence.</span>
            </h1>

            {/* Short Subtitle */}
            <p className="text-xs sm:text-sm font-semibold text-[#475569] leading-relaxed max-w-lg">
              Upload your resume and practice personalized AI interviews based on your actual skills, projects, experience and target role. Get real feedback, identify gaps, and improve with confidence.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/role-selection"
                className="bg-[#1E2544] hover:bg-[#2A3256] text-white font-black text-xs py-3.5 px-7 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#FFB800]" />
              </Link>

              <a
                href="#how-it-works"
                className="bg-white/90 hover:bg-white border border-[#EADCB9] text-[#1E2544] font-extrabold text-xs py-3.5 px-5 rounded-2xl shadow-xs transition flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[#F97316]">
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <span>See how it works</span>
              </a>
            </div>
          </div>

          {/* Hero Visual Container (Right 7 cols) - Self-contained & 100% visible */}
          <div className="lg:col-span-7 flex justify-center items-center py-4">
            <div className="relative w-full max-w-[580px] mx-auto p-4 sm:p-6">
              {/* Floating Badge 1: Top-Left */}
              <div className="absolute top-0 left-0 z-20 flex items-center gap-2 bg-white/95 border border-[#EADCB9] px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-xs">
                <div className="w-6 h-6 rounded-xl bg-amber-50 text-[#F97316] flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black text-[#1E2544]">Resume Analysis</span>
              </div>

              {/* Floating Badge 2: Bottom-Left */}
              <div className="absolute bottom-1 left-2 z-20 flex items-center gap-2 bg-white/95 border border-[#EADCB9] px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-xs">
                <div className="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquareText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black text-[#1E2544]">Personalized Questions</span>
              </div>

              {/* Floating Badge 3: Top-Right */}
              <div className="absolute top-2 right-0 z-20 flex items-center gap-2 bg-white/95 border border-[#EADCB9] px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-xs">
                <div className="w-6 h-6 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black text-[#1E2544]">Performance Feedback</span>
              </div>

              {/* Floating Badge 4: Bottom-Right */}
              <div className="absolute bottom-2 right-0 z-20 flex items-center gap-2 bg-white/95 border border-[#EADCB9] px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-xs">
                <div className="w-6 h-6 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black text-[#1E2544]">Skill Gap Insights</span>
              </div>

              {/* Laptop Display Container */}
              <div className="bg-[#0F172A] rounded-t-2xl p-2.5 border-2 border-slate-700 shadow-2xl relative">
                {/* Webcam Notch */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 mx-auto mb-1.5 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-400" />
                </div>

                {/* Mockup Screen Content */}
                <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden text-left font-sans text-slate-900 shadow-inner">
                  {/* Mockup App Header */}
                  <div className="h-8 bg-white border-b border-slate-200 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-[#FFB800] flex items-center justify-center text-[#1E2544] font-black text-[8px]">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-extrabold text-[11px] text-[#1E2544]">PrepPilot</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="w-4.5 h-4.5 rounded-full bg-[#1E2544] text-white text-[8px] font-black flex items-center justify-center">
                        JD
                      </div>
                    </div>
                  </div>

                  {/* Mockup App Content Body */}
                  <div className="p-2.5 grid grid-cols-12 gap-2 bg-[#F8FAFC]">
                    {/* Left Navigation Preview */}
                    <div className="col-span-3 bg-white rounded-lg border border-slate-200 p-1.5 space-y-1 text-[9px] font-bold text-slate-500 hidden sm:block">
                      <div className="px-1.5 py-0.5 text-slate-400 font-extrabold uppercase text-[7px]">NAVIGATE</div>
                      <div className="px-1.5 py-0.5 rounded text-slate-600">Dashboard</div>
                      <div className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-black border border-blue-100">
                        Interview Practice
                      </div>
                      <div className="px-1.5 py-0.5 rounded text-slate-600">History</div>
                      <div className="px-1.5 py-0.5 rounded text-slate-600">Performance</div>
                    </div>

                    {/* Main Interview Practice Area (6 cols) */}
                    <div className="col-span-12 sm:col-span-6 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-[11px] font-black text-[#1E2544]">Interview Practice</h4>
                          <p className="text-[8px] text-slate-400 font-medium">Full Stack Engineer Track</p>
                        </div>
                      </div>

                      {/* Question Counter + Timer */}
                      <div className="bg-white rounded-lg border border-slate-200 px-2 py-1 flex items-center justify-between text-[9px] font-bold text-slate-600">
                        <span>Question 3 of 10</span>
                        <div className="flex items-center gap-1 text-blue-600 font-mono text-[9px]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>12:34</span>
                        </div>
                      </div>

                      {/* AI Prompt Box */}
                      <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-1 text-[8px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                          <Brain className="w-2.5 h-2.5 text-blue-600" />
                          <span>AI Interviewer</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-900 leading-snug">
                          "Can you walk me through a challenging project you worked on and how you approached it?"
                        </p>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-200 text-[8px] text-slate-400 italic">
                          Type your answer here...
                        </div>
                        <button className="w-full py-1 bg-[#1E2544] text-white text-[8px] font-black rounded shadow-xs flex items-center justify-center gap-1">
                          <span>Submit Answer</span>
                          <ArrowRight className="w-2.5 h-2.5 text-[#FFB800]" />
                        </button>
                      </div>
                    </div>

                    {/* Right Context & Tips (3 cols) */}
                    <div className="col-span-3 space-y-1.5 hidden sm:block">
                      <div className="bg-white rounded-lg border border-slate-200 p-1.5 space-y-1">
                        <span className="text-[7px] font-black uppercase text-slate-400 block">Resume Context</span>
                        <div className="space-y-0.5 text-[8px] font-bold text-slate-700">
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                            <span>React & TS</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span>Node.js APIs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-purple-500" />
                            <span>System Design</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50/60 rounded-lg border border-amber-200 p-1.5 space-y-0.5 text-[8px] font-semibold text-amber-900">
                        <span className="font-extrabold text-amber-900 block uppercase tracking-wider text-[7px]">
                          💡 Interview Tips
                        </span>
                        <p>✓ Be specific</p>
                        <p>✓ Explain logic</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop Base Stand */}
              <div className="w-full bg-slate-800 h-2.5 rounded-b-lg border-x-2 border-b-2 border-slate-700 shadow-md flex justify-center items-center">
                <div className="w-12 h-0.5 rounded-full bg-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION 2: HOW IT WORKS                                   */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-16 bg-white border-y border-[#EADCB9]">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-10">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#F97316] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E2544] tracking-tight">
              From your resume to real confidence
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Three simple steps to prepare for your dream role with AI grounding.
            </p>
          </div>

          {/* 3 Steps Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 01 */}
            <div className="bg-[#FEF9EF] rounded-3xl border-2 border-[#EADCB9] p-6 shadow-xs hover:shadow-md transition text-left space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-[#F97316] bg-white px-2.5 py-1 rounded-lg border border-[#EADCB9]">
                  01
                </span>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center my-4 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#1E2544]">Upload your resume</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1.5 leading-relaxed">
                  Share your resume PDF and target role so PrepPilot can extract your skills, projects, and domain focus.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-[#FEF9EF] rounded-3xl border-2 border-[#EADCB9] p-6 shadow-xs hover:shadow-md transition text-left space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-[#F97316] bg-white px-2.5 py-1 rounded-lg border border-[#EADCB9]">
                  02
                </span>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F97316] flex items-center justify-center my-4 shadow-xs">
                  <MessageSquareText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#1E2544]">Practice a personalized interview</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1.5 leading-relaxed">
                  Answer AI-generated technical and behavioral questions grounded directly in your experience and target domain.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-[#FEF9EF] rounded-3xl border-2 border-[#EADCB9] p-6 shadow-xs hover:shadow-md transition text-left space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-[#F97316] bg-white px-2.5 py-1 rounded-lg border border-[#EADCB9]">
                  03
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center my-4 shadow-xs">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#1E2544]">Get feedback and improve</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1.5 leading-relaxed">
                  Receive instant detailed scores, strength analysis, and actionable feedback to boost your interview performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 3: CORE FEATURES (`#features`)                     */}
      {/* ============================================================ */}
      <section id="features" className="py-16 bg-[#FEF9EF]">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1E2544] bg-[#FFB800] px-3 py-1 rounded-full shadow-2xs">
              PLATFORM FEATURES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E2544] tracking-tight">
              Engineered for genuine interview readiness
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Powered by Google Gemini 2.5 Flash & Pinecone Vector Search.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl border border-[#EADCB9] p-5 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-[#1E2544]">Gemini 2.5 Grounding</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Questions are synthesized based on your actual resume projects and technical claimed depth.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl border border-[#EADCB9] p-5 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-[#1E2544]">Pinecone Vector Store</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Semantic chunking indexes your experience for ultra-fast context retrieval during sessions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl border border-[#EADCB9] p-5 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-[#1E2544]">Interactive Voice Agent</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Practice with real-time text-to-speech audio interviewer prompts and spoken answer recognition.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl border border-[#EADCB9] p-5 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-[#1E2544]">Skill Gap Remediation</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Get specific breakdown of what you answered well and where to deepen your domain knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SECTION 4: PRODUCT JOURNEY STORY (`#about`)               */}
      {/* ============================================================ */}
      <section id="about" className="py-16 bg-white border-t border-[#EADCB9]">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#F97316] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              THE JOURNEY
            </span>
            <h2 className="text-3xl font-black text-[#1E2544] tracking-tight">
              Designed around your career target
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              No generic questions. PrepPilot aligns every interview with your specific role goals.
            </p>
          </div>

          <div className="bg-[#FEF9EF] rounded-3xl border-2 border-[#EADCB9] p-6 shadow-xs grid grid-cols-2 sm:grid-cols-6 gap-3 items-center text-xs font-extrabold text-[#1E2544]">
            <div className="p-3 bg-white rounded-2xl border border-[#EADCB9] shadow-2xs">📄 Resume</div>
            <span className="text-[#F97316] text-lg font-black hidden sm:block">➔</span>
            <div className="p-3 bg-white rounded-2xl border border-[#EADCB9] shadow-2xs">🧠 Vector Store</div>
            <span className="text-[#F97316] text-lg font-black hidden sm:block">➔</span>
            <div className="p-3 bg-white rounded-2xl border border-[#EADCB9] shadow-2xs">💬 AI Interview</div>
            <div className="p-3 bg-white rounded-2xl border border-[#EADCB9] shadow-2xs">📊 Feedback</div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FINAL CTA BANNER                                          */}
      {/* ============================================================ */}
      <section className="py-16 bg-[#FEF9EF]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#FFF7ED] rounded-[32px] border-4 border-[#EADCB9] p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 text-left max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">
                YOUR RESUME. YOUR ROLE. YOUR INTERVIEW.
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E2544] tracking-tight">
                Get job-ready with personalized AI interview practice.
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                Build confidence. Improve your skills. Take the next step in your career with PrepPilot.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
              <Link
                href="/role-selection"
                className="bg-[#1E2544] hover:bg-[#2A3256] text-white font-black text-xs py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#FFB800]" />
              </Link>
              <span className="text-[10px] font-bold text-slate-400">
                🔒 Free to get started. No credit card required.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="bg-[#1E2544] text-white border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
            {/* Brand Column (2 cols) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFB800] flex items-center justify-center text-[#1E2544] font-black shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#1E2544]" />
                </div>
                <span className="font-black text-xl text-white tracking-tight">PrepPilot</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-sm">
                AI-powered interview preparation and candidate evaluation platform. Practice real behavioral and technical interviews tailored directly to your resume and target role.
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 2.5 & Pinecone Connected</span>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-[#FFB800] uppercase tracking-wider text-[10px]">Platform</h4>
              <ul className="space-y-2 font-semibold text-slate-400">
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition">Features & AI Engine</a></li>
                <li><a href="#about" className="hover:text-white transition">Product Journey</a></li>
                <li><Link href="/role-selection" className="hover:text-white transition">Role Selection Portal</Link></li>
              </ul>
            </div>

            {/* Column 3: Tracks */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-[#FFB800] uppercase tracking-wider text-[10px]">Interview Tracks</h4>
              <ul className="space-y-2 font-semibold text-slate-400">
                <li><Link href="/role-selection" className="hover:text-white transition">Full-Stack Engineering</Link></li>
                <li><Link href="/role-selection" className="hover:text-white transition">Frontend & Performance</Link></li>
                <li><Link href="/role-selection" className="hover:text-white transition">Generative AI & LLMs</Link></li>
                <li><Link href="/role-selection" className="hover:text-white transition">Cloud & Security Architecture</Link></li>
              </ul>
            </div>

            {/* Column 4: Access */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-[#FFB800] uppercase tracking-wider text-[10px]">Portals</h4>
              <ul className="space-y-2 font-semibold text-slate-400">
                <li><Link href="/role-selection" className="hover:text-white transition">Candidate Portal</Link></li>
                <li><Link href="/admin/login" className="hover:text-white transition">Admin Console</Link></li>
                <li><Link href="/admin/system" className="hover:text-white transition">System Status</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-semibold">
            <p>© 2026 PrepPilot. All rights reserved.</p>
            <p className="text-[11px] text-slate-500">
              Powered by Google Gemini 2.5 Flash & Pinecone Vector Search
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

