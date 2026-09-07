"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSession, getSession, submitAnswer, type Question } from "@/lib/api";

interface AnswerResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession(params.sessionId)
      .then((data) => setQuestions(data.questions))
      .finally(() => setLoading(false));
  }, [params.sessionId]);

  const current = questions[index];

  async function handleSubmit() {
    if (!current || !answerText.trim()) return;
    setSubmitting(true);
    try {
      const { answer } = await submitAnswer({
        questionId: current.id,
        sessionId: params.sessionId,
        answerText,
      });
      setResult(answer);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    setResult(null);
    setAnswerText("");
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      await completeSession(params.sessionId);
      router.push(`/dashboard`);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950">
        <p className="font-sans text-chalk-200/60">Loading session…</p>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950">
        <p className="font-sans text-chalk-200/60">No questions found for this session.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-950">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <p className="font-sans text-sm text-chalk-200/50">
          Question {index + 1} of {questions.length} · {current.category}
        </p>
        <h1 className="mt-4 font-serif text-2xl leading-snug text-chalk-50">{current.prompt}</h1>

        {!result ? (
          <div className="mt-8">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={8}
              placeholder="Type your answer as you'd say it out loud…"
              className="w-full border border-chalk-200/20 bg-ink-900 px-4 py-3 font-sans text-chalk-50 placeholder:text-chalk-200/30 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !answerText.trim()}
              className="mt-4 border border-amber-500 bg-amber-500 px-6 py-3 font-sans text-sm font-medium text-ink-950 transition hover:bg-amber-600 disabled:opacity-50"
            >
              {submitting ? "Evaluating…" : "Submit answer"}
            </button>
          </div>
        ) : (
          <div className="mt-8 border border-chalk-200/10 bg-ink-900 p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-sm text-chalk-200/60">Score</span>
              <span className="font-serif text-3xl text-amber-500">{Math.round(result.score)}</span>
            </div>

            <p className="mt-4 font-sans text-sm leading-relaxed text-chalk-100">{result.feedback}</p>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-sans text-xs uppercase tracking-wide text-moss-500">Strengths</h3>
                <ul className="mt-2 space-y-1 font-sans text-sm text-chalk-200/80">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-sans text-xs uppercase tracking-wide text-clay-500">To improve</h3>
                <ul className="mt-2 space-y-1 font-sans text-sm text-chalk-200/80">
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="mt-8 border border-chalk-200/30 px-6 py-3 font-sans text-sm font-medium text-chalk-100 transition hover:border-chalk-200/60"
            >
              {index + 1 < questions.length ? "Next question" : "Finish session"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
