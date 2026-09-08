"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeSession, getSession, submitAnswer, type Question, type Answer } from "@/lib/api";

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const answerTextRef = useRef(answerText);
  const baseTextRef = useRef("");

  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);

  const [result, setResult] = useState<Answer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resume snippet accordion
  const [showSnippet, setShowSnippet] = useState(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Voice Mode & Text-to-Speech (Agent speaks)
  const [voiceMode, setVoiceMode] = useState(true);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [autoListenAfterQuestion, setAutoListenAfterQuestion] = useState(true);
  const [hasStartedVoiceSession, setHasStartedVoiceSession] = useState(false);

  // Speech Recognition (Candidate speaks)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    getSession(params.sessionId)
      .then((data) => {
        setQuestions(data.questions);
        setRole(data.session.role);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load interview session.");
      })
      .finally(() => setLoading(false));
  }, [params.sessionId]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechClass) {
        setSpeechSupported(true);
        const recognizer = new SpeechClass();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognizer.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            if (item.isFinal) {
              finalTranscript += item[0].transcript + " ";
            } else {
              interimTranscript += item[0].transcript;
            }
          }

          const base = baseTextRef.current ? baseTextRef.current.trim() : "";
          const spoken = (finalTranscript + interimTranscript).trim();
          const combined = base && spoken ? `${base} ${spoken}` : base || spoken;
          setAnswerText(combined);
        };

        recognizer.onerror = (err: unknown) => {
          console.warn("Speech recognition error:", err);
          setIsListening(false);
          baseTextRef.current = answerTextRef.current;
        };

        recognizer.onend = () => {
          setIsListening(false);
          baseTextRef.current = answerTextRef.current;
        };

        recognitionRef.current = recognizer;
      }
    }
  }, []);

  // Timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && !result) {
      interval = setInterval(() => {
        setSecondsElapsed((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, result]);

  // Voice Output (Agent Speaks)
  const speakText = useCallback(
    (textToSpeak: string, onEndCallback?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Premium") ||
              v.name.includes("Daniel"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setIsAgentSpeaking(true);
      };

      utterance.onend = () => {
        setIsAgentSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = () => {
        setIsAgentSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [speechRate]
  );

  const stopAgentSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
    }
  }, []);

  const current = questions[index];

  // Auto-speak question when question changes or when session begins
  useEffect(() => {
    if (current && voiceMode && hasStartedVoiceSession && !result) {
      // Small pause before speaking
      const timeout = setTimeout(() => {
        speakText(current.prompt, () => {
          // If auto-listen is on, start user mic
          if (autoListenAfterQuestion && recognitionRef.current) {
            try {
              baseTextRef.current = answerTextRef.current;
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.warn("Auto mic trigger error:", e);
            }
          }
        });
      }, 400);

      return () => {
        clearTimeout(timeout);
        stopAgentSpeech();
      };
    }
  }, [index, current, voiceMode, hasStartedVoiceSession, autoListenAfterQuestion, speakText, stopAgentSpeech, result]);

  function startVoiceExperience() {
    setHasStartedVoiceSession(true);
    if (current) {
      speakText(current.prompt, () => {
        if (autoListenAfterQuestion && recognitionRef.current) {
          try {
            baseTextRef.current = answerTextRef.current;
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.warn("Mic start error:", e);
          }
        }
      });
    }
  }

  function replayQuestionAudio() {
    if (!current) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    speakText(current.prompt, () => {
      if (autoListenAfterQuestion && recognitionRef.current) {
        try {
          baseTextRef.current = answerTextRef.current;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn("Auto mic error:", e);
        }
      }
    });
  }

  function toggleSpeech() {
    if (!recognitionRef.current) return;
    const rec = recognitionRef.current;
    if (isListening) {
      rec.stop();
      setIsListening(false);
      baseTextRef.current = answerTextRef.current;
    } else {
      stopAgentSpeech();
      try {
        baseTextRef.current = answerTextRef.current;
        rec.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Start speech error:", e);
      }
    }
  }

  async function handleSubmit() {
    if (!current || !answerText.trim()) return;
    stopAgentSpeech();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setSubmitting(true);
    setError(null);

    try {
      const { answer } = await submitAnswer({
        questionId: current.id,
        sessionId: params.sessionId,
        answerText: answerText.trim(),
      });
      setResult(answer);
      setIsTimerActive(false);

      // Optional: speak coaching summary if voice mode enabled
      if (voiceMode && answer.score != null) {
        const spokenFeedback = `You scored ${Math.round(answer.score)} out of 100. ${
          answer.feedback ? answer.feedback.slice(0, 180) : ""
        }`;
        setTimeout(() => speakText(spokenFeedback), 500);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to evaluate answer. Please verify your GEMINI_API_KEY in backend/.env"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    stopAgentSpeech();
    setResult(null);
    setAnswerText("");
    baseTextRef.current = "";
    setShowSnippet(false);
    setSecondsElapsed(0);
    setIsTimerActive(true);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      await completeSession(params.sessionId);
      router.push(`/dashboard`);
    }
  }

  function handleTryAgain() {
    stopAgentSpeech();
    setResult(null);
    setIsTimerActive(true);
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950 text-chalk-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="font-sans text-sm text-chalk-200/60">Preparing your voice interview room…</p>
        </div>
      </main>
    );
  }

  if (error && !current) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950 p-6 text-chalk-200">
        <div className="max-w-md rounded border border-clay-500/40 bg-ink-900 p-6 text-center">
          <p className="font-serif text-lg text-chalk-50">Session Error</p>
          <p className="mt-2 font-sans text-sm text-clay-400">{error}</p>
          <Link
            href="/upload"
            className="mt-6 inline-block rounded bg-amber-500 px-4 py-2 font-sans text-xs font-semibold text-ink-950 hover:bg-amber-400"
          >
            Start New Session
          </Link>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950 text-chalk-200">
        <div className="text-center">
          <p className="font-sans text-chalk-200/60">No questions found for this session.</p>
          <Link href="/upload" className="mt-4 inline-block font-sans text-sm text-amber-500 hover:underline">
            ← Back to Setup
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-950 text-chalk-100">
      {/* Top Header */}
      <header className="border-b border-chalk-200/10 bg-ink-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-lg tracking-tight text-chalk-50 hover:text-amber-500 transition">
              Rehearsal
            </Link>
            <span className="text-chalk-200/30">/</span>
            <span className="font-sans text-xs text-chalk-200/70 truncate max-w-[160px] sm:max-w-none">
              {role || "Mock Interview"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isAgentSpeaking) stopAgentSpeech();
                setVoiceMode(!voiceMode);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium transition ${
                voiceMode
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-ink-900 text-chalk-200/50 border border-chalk-200/10"
              }`}
            >
              <span>{voiceMode ? "🔊 Voice Agent Active" : "🔇 Voice Agent Muted"}</span>
            </button>

            {/* Pacing Timer */}
            <div className="flex items-center gap-2 rounded bg-ink-900 px-3 py-1 border border-chalk-200/10 font-mono text-xs text-chalk-200/80">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {formatTimer(secondsElapsed)}
            </div>

            <Link
              href="/dashboard"
              className="font-sans text-xs text-chalk-200/60 hover:text-chalk-50 transition border border-chalk-200/20 px-3 py-1 rounded"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Stage */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Voice Interview Start Gate (Needed for browser audio permissions on initial entry) */}
        {!hasStartedVoiceSession && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-gradient-to-b from-ink-900 to-ink-950 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl border border-amber-500/20 shadow-inner">
              🎙️
            </div>
            <h2 className="mt-4 font-serif text-2xl text-chalk-50">Interactive AI Voice Interview</h2>
            <p className="mx-auto mt-2 max-w-md font-sans text-xs text-chalk-200/70 leading-relaxed">
              Your AI Interviewer will speak questions out loud and listen to your spoken answers. Click below to begin
              the live dialogue.
            </p>
            <button
              onClick={startVoiceExperience}
              className="mt-6 rounded-full border border-amber-500 bg-amber-500 px-8 py-3 font-sans text-sm font-semibold text-ink-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              Start Speaking with Interviewer →
            </button>
          </div>
        )}

        {/* AI Agent Persona Stage */}
        <div className="rounded-xl border border-chalk-200/15 bg-ink-900/90 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Agent Avatar / Indicator */}
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                  isAgentSpeaking
                    ? "border-amber-400 bg-amber-500/20 ring-4 ring-amber-500/20"
                    : isListening
                    ? "border-clay-400 bg-clay-500/20 ring-4 ring-clay-500/20"
                    : "border-chalk-200/20 bg-ink-800"
                }`}
              >
                {isAgentSpeaking ? (
                  /* Animated Waveform */
                  <div className="flex items-end gap-0.5 h-5">
                    <span className="h-2.5 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: "0ms" }} />
                    <span className="h-5 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: "150ms" }} />
                    <span className="h-4 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: "300ms" }} />
                    <span className="h-2 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: "450ms" }} />
                  </div>
                ) : isListening ? (
                  /* Mic Pulsing */
                  <div className="flex items-end gap-0.5 h-5">
                    <span className="h-3 w-1 bg-clay-400 animate-pulse rounded-full" />
                    <span className="h-5 w-1 bg-clay-400 animate-pulse rounded-full" />
                    <span className="h-2 w-1 bg-clay-400 animate-pulse rounded-full" />
                  </div>
                ) : (
                  <span className="text-xl">🤖</span>
                )}
              </div>

              <div>
                <p className="font-serif text-sm font-medium text-chalk-50">AI Hiring Lead</p>
                <p className="font-sans text-xs">
                  {isAgentSpeaking ? (
                    <span className="text-amber-400 font-medium animate-pulse">Speaking question out loud…</span>
                  ) : isListening ? (
                    <span className="text-clay-400 font-medium animate-pulse">Listening to your answer…</span>
                  ) : submitting ? (
                    <span className="text-amber-300 font-medium animate-pulse">Analyzing with Gemini…</span>
                  ) : (
                    <span className="text-chalk-200/50">Ready for your answer</span>
                  )}
                </p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={replayQuestionAudio}
                title="Listen to question again"
                className="flex items-center gap-1.5 rounded-md border border-chalk-200/20 bg-ink-800 px-3 py-1.5 font-sans text-xs text-chalk-200 hover:text-chalk-50 hover:border-amber-500/50 transition"
              >
                <span>🔊</span>
                <span className="hidden sm:inline">Replay Question</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoListenAfterQuestion(!autoListenAfterQuestion)}
                title="Toggle whether microphone automatically opens after question ends"
                className={`rounded-md border px-2.5 py-1.5 font-sans text-xs transition ${
                  autoListenAfterQuestion
                    ? "border-moss-500/30 bg-moss-500/10 text-moss-400"
                    : "border-chalk-200/20 bg-ink-800 text-chalk-200/50"
                }`}
              >
                Auto-Mic: {autoListenAfterQuestion ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Question Header & Category */}
        <div className="mt-8 border-b border-chalk-200/10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-500">
                Question {index + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-ink-800 px-2.5 py-0.5 font-sans text-[11px] capitalize text-chalk-200/80 border border-chalk-200/10">
                {current.category || "General"}
              </span>
            </div>

            {current.tailored_from_resume && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-500/15 border border-moss-500/30 px-3 py-0.5 font-sans text-xs font-medium text-moss-400">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-500" />
                Grounded in Pinecone Resume Chunk
              </span>
            )}
          </div>

          <h1 className="mt-4 font-serif text-2xl sm:text-3xl leading-snug text-chalk-50">
            {current.prompt}
          </h1>

          {/* Expandable resume grounding snippet */}
          {current.resume_snippet && (
            <div className="mt-4">
              <button
                onClick={() => setShowSnippet(!showSnippet)}
                className="flex items-center gap-2 font-sans text-xs text-amber-500/90 hover:text-amber-400 transition"
              >
                <span>{showSnippet ? "▾ Hide Resume Excerpt" : "▸ View Resume Excerpt that inspired this question"}</span>
              </button>
              {showSnippet && (
                <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 p-3.5 font-sans text-xs text-chalk-200/80 leading-relaxed">
                  <span className="font-semibold text-amber-400">Resume Excerpt: </span>
                  {current.resume_snippet}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Phase */}
        {!result ? (
          <div className="mt-6 space-y-4">
            <div className="relative">
              <textarea
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  baseTextRef.current = e.target.value;
                }}
                rows={8}
                placeholder="Speak out loud into your microphone, or type your response here..."
                className="w-full rounded border border-chalk-200/20 bg-ink-900 p-4 font-sans text-sm text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />

              {/* Voice Speech Recognition Button */}
              {speechSupported && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    title={isListening ? "Stop voice dictation" : "Start voice dictation"}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-sans text-xs font-medium transition shadow-md ${
                      isListening
                        ? "bg-clay-500 text-chalk-50 animate-pulse ring-2 ring-clay-400"
                        : "bg-ink-800 text-chalk-200/90 hover:bg-ink-700 border border-chalk-200/20"
                    }`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${isListening ? "bg-white" : "bg-clay-500"}`} />
                    {isListening ? "Listening (Click to Stop)" : "🎙️ Speak Answer"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded border border-clay-500/30 bg-clay-500/10 p-3 font-sans text-xs text-clay-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-chalk-200/50">
                  {answerText.trim() ? `${answerText.trim().split(/\s+/).length} words recorded` : "Speak clearly into your microphone"}
                </span>
                {answerText.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswerText("");
                      baseTextRef.current = "";
                    }}
                    className="font-sans text-xs text-clay-400 hover:text-clay-300 underline transition cursor-pointer"
                  >
                    Clear text
                  </button>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !answerText.trim()}
                className="rounded border border-amber-500 bg-amber-500 px-6 py-2.5 font-sans text-sm font-semibold text-ink-950 transition hover:bg-amber-400 hover:border-amber-400 disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                {submitting ? "Gemini is Evaluating..." : "Submit Answer"}
              </button>
            </div>
          </div>
        ) : (
          /* Evaluation Results Phase */
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-chalk-200/20 bg-ink-900 p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-chalk-200/10 pb-5">
                <div>
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-chalk-200/50">
                    Gemini Interview Evaluation
                  </span>
                  <p className="mt-1 font-serif text-lg text-chalk-50">
                    {result.score != null && result.score >= 85
                      ? "Outstanding Response"
                      : result.score != null && result.score >= 70
                      ? "Solid Answer with Polish Areas"
                      : "Developing Answer"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-chalk-200/50">Score</span>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-serif text-2xl font-bold ${
                      result.score != null && result.score >= 85
                        ? "border-moss-500 text-moss-400 bg-moss-500/10"
                        : result.score != null && result.score >= 70
                        ? "border-amber-500 text-amber-400 bg-amber-500/10"
                        : "border-clay-500 text-clay-400 bg-clay-500/10"
                    }`}
                  >
                    {result.score != null ? Math.round(result.score) : "—"}
                  </div>
                </div>
              </div>

              {/* Actionable Feedback */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xs uppercase tracking-wider text-chalk-200/50 font-semibold">
                    Coaching Feedback
                  </h3>
                  <button
                    type="button"
                    onClick={() => result.feedback && speakText(result.feedback)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-sans"
                  >
                    🔊 Listen to Feedback
                  </button>
                </div>
                <p className="mt-2 font-sans text-sm leading-relaxed text-chalk-100">
                  {result.feedback}
                </p>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-chalk-200/10">
                <div>
                  <h3 className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-moss-400">
                    <span>✓</span> Strengths
                  </h3>
                  <ul className="mt-2 space-y-1.5 font-sans text-xs text-chalk-200/80">
                    {result.strengths && result.strengths.length > 0 ? (
                      result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-moss-500 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-chalk-200/50">Addressed the question.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-clay-400">
                    <span>△</span> Areas to Improve
                  </h3>
                  <ul className="mt-2 space-y-1.5 font-sans text-xs text-chalk-200/80">
                    {result.weaknesses && result.weaknesses.length > 0 ? (
                      result.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-clay-500 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-chalk-200/50">Keep practicing concise delivery.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Model Answer Exemplar */}
              {result.model_answer && (
                <div className="mt-6 rounded border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Exemplar Answer Strategy (Senior Candidate)
                    </span>
                    <button
                      type="button"
                      onClick={() => result.model_answer && speakText(result.model_answer)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-sans"
                    >
                      🔊 Listen
                    </button>
                  </div>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-chalk-200/90 italic">
                    "{result.model_answer}"
                  </p>
                </div>
              )}

              {/* Pro Tip */}
              {result.follow_up_tip && (
                <p className="mt-4 font-sans text-xs text-chalk-200/60">
                  <strong className="text-amber-400">Executive Pro-Tip:</strong> {result.follow_up_tip}
                </p>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handleTryAgain}
                className="rounded border border-chalk-200/20 bg-ink-900 px-4 py-2.5 font-sans text-xs font-medium text-chalk-200 hover:border-chalk-200/50 transition"
              >
                ↺ Refine & Practice Answer Again
              </button>

              <button
                onClick={handleNext}
                className="rounded border border-amber-500 bg-amber-500 px-6 py-2.5 font-sans text-sm font-semibold text-ink-950 hover:bg-amber-400 hover:border-amber-400 transition shadow-md shadow-amber-500/10"
              >
                {index + 1 < questions.length ? "Next Question →" : "Finish Session & View Dashboard →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
