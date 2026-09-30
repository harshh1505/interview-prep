import { type Session, type Question, type Answer } from "@/lib/api";

export interface EnrichedSession extends Session {
  questions?: Question[];
  allAnswers?: Answer[];
}

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  highScoreAnswers: number;
  avgScore: number | null;
  topScore: number | null;
  weaknessAreas: Record<string, number>;
  strengthAreas: Record<string, number>;
  categoryBreakdown: Record<string, { total: number; avgScore: number }>;
}

export interface DashboardStorageData {
  userId?: string;
  totalInterviewsGiven: number;
  completedInterviews: number;
  avgScore: number | null;
  topScore: number | null;
  totalQuestionsAnswered: number;
  sessions: EnrichedSession[];
  lastUpdated: string;
}

export const DASHBOARD_STORAGE_KEY = "rehearsal_dashboard_data";

export const DEFAULT_SHOWCASE_SESSIONS: EnrichedSession[] = [
  {
    id: "session-demo-001",
    user_id: "00000000-0000-0000-0000-000000000000",
    role: "Full-Stack Engineer",
    domain: "Next.js, Node.js & Distributed Systems",
    status: "completed",
    overall_score: 88,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 18).toISOString(),
    questions: [
      {
        id: "q-1",
        prompt: "How did you design high-throughput APIs handling 10,000+ daily transactions efficiently?",
        category: "system-design",
        order_index: 0,
        tailored_from_resume: true,
        rubric_criteria: ["Architecture choices", "Database indexation", "Caching strategies"],
      },
      {
        id: "q-2",
        prompt: "Walk me through how you implement JWT and Supabase authentication with Next.js SSR middleware.",
        category: "technical",
        order_index: 1,
        tailored_from_resume: true,
        rubric_criteria: ["Cookie security", "Refresh rotation", "Edge runtime considerations"],
      },
    ],
    allAnswers: [
      {
        id: "a-1",
        question_id: "q-1",
        session_id: "session-demo-001",
        answer_text: "We implemented read-replicas in PostgreSQL, utilized Redis for sub-millisecond session caching, and paginated dynamic queries using cursor-based keyset pagination.",
        score: 90,
        strengths: ["Database schema design", "Cursor pagination mastery", "Sub-millisecond caching strategy"],
        weaknesses: ["Could elaborate more on connection pooling with pgBouncer"],
        feedback: "Excellent technical depth and architectural clarity.",
      },
      {
        id: "a-2",
        question_id: "q-2",
        session_id: "session-demo-001",
        answer_text: "Used @supabase/ssr with HttpOnly secure cookies, verified token expiry inside Next.js edge middleware, and handled unauthenticated redirects safely.",
        score: 86,
        strengths: ["Security best practices", "Next.js SSR middleware lifecycle"],
        weaknesses: ["Did not cover token refresh concurrency race conditions"],
        feedback: "Strong grasp of modern SSR authentication flow.",
      },
    ],
  },
  {
    id: "session-demo-002",
    user_id: "00000000-0000-0000-0000-000000000000",
    role: "AI & Vector Search Specialist",
    domain: "Pinecone, Gemini RAG & Embeddings",
    status: "completed",
    overall_score: 82,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 22).toISOString(),
    questions: [
      {
        id: "q-3",
        prompt: "Explain how you chunked resume text and retrieved semantic context with Pinecone and Gemini.",
        category: "rag-architecture",
        order_index: 0,
        tailored_from_resume: true,
      },
    ],
    allAnswers: [
      {
        id: "a-3",
        question_id: "q-3",
        session_id: "session-demo-002",
        answer_text: "Used sliding window chunking with 400 token chunks and 50 token overlap. Extracted 1024-dimensional embeddings using Gemini text-embedding-004 and performed cosine similarity queries in Pinecone.",
        score: 82,
        strengths: ["Chunk overlap strategy", "Vector index configuration", "Embedding dimension accuracy"],
        weaknesses: ["Could benchmark hybrid search vs dense retrieval"],
        feedback: "Very thorough understanding of RAG pipeline engineering.",
      },
    ],
  },
  {
    id: "session-demo-003",
    user_id: "00000000-0000-0000-0000-000000000000",
    role: "Backend Infrastructure",
    domain: "Distributed Queues & Microservices",
    status: "completed",
    overall_score: 94,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 25).toISOString(),
    questions: [
      {
        id: "q-4",
        prompt: "How do you guarantee idempotency and zero message loss in an event-driven payment webhook?",
        category: "system-resilience",
        order_index: 0,
      },
    ],
    allAnswers: [
      {
        id: "a-4",
        question_id: "q-4",
        session_id: "session-demo-003",
        answer_text: "Implemented unique idempotency keys in Redis with transactional SETNX, paired with Postgres unique constraints and dead-letter queue (DLQ) retry policies.",
        score: 94,
        strengths: ["Idempotency keys", "Dead letter queue handling", "Distributed locks"],
        weaknesses: [],
        feedback: "Exceptional mastery of transactional reliability and distributed event handling.",
      },
    ],
  },
];

export function computeStatsFromSessions(sessions: EnrichedSession[]): DashboardStats {
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.overall_score != null
  );

  let totalQuestionsAnswered = 0;
  let highScoreAnswers = 0;
  const weaknessMap: Record<string, number> = {};
  const strengthMap: Record<string, number> = {};
  const categoryMap: Record<string, { scores: number[] }> = {};

  for (const session of sessions) {
    const answers = session.allAnswers || [];
    totalQuestionsAnswered += answers.length;

    for (const answer of answers) {
      if ((answer.score ?? 0) >= 75) highScoreAnswers++;

      for (const w of answer.weaknesses || []) {
        const key = w.trim().toLowerCase();
        if (key) weaknessMap[key] = (weaknessMap[key] || 0) + 1;
      }
      for (const s of answer.strengths || []) {
        const key = s.trim().toLowerCase();
        if (key) strengthMap[key] = (strengthMap[key] || 0) + 1;
      }

      const cat = (session.questions?.find((q) => q.id === answer.question_id)?.category) || "general";
      if (!categoryMap[cat]) categoryMap[cat] = { scores: [] };
      if (answer.score != null) categoryMap[cat].scores.push(answer.score);
    }
  }

  const categoryBreakdown: Record<string, { total: number; avgScore: number }> = {};
  for (const [cat, { scores }] of Object.entries(categoryMap)) {
    categoryBreakdown[cat] = {
      total: scores.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }

  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((acc, s) => acc + (s.overall_score ?? 0), 0) / completed.length)
      : null;

  const topScore =
    completed.length > 0
      ? Math.round(Math.max(...completed.map((s) => s.overall_score ?? 0)))
      : null;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    totalQuestionsAnswered,
    highScoreAnswers,
    avgScore,
    topScore,
    weaknessAreas: weaknessMap,
    strengthAreas: strengthMap,
    categoryBreakdown,
  };
}

/**
 * Get stored dashboard data from localStorage.
 * If empty, seeds with default showcase data and persists it.
 */
export function getStoredDashboardData(userId?: string): DashboardStorageData {
  if (typeof window === "undefined") {
    return {
      userId,
      totalInterviewsGiven: DEFAULT_SHOWCASE_SESSIONS.length,
      completedInterviews: DEFAULT_SHOWCASE_SESSIONS.length,
      avgScore: 88,
      topScore: 94,
      totalQuestionsAnswered: 4,
      sessions: DEFAULT_SHOWCASE_SESSIONS,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardStorageData;
      if (parsed && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to parse stored dashboard data:", err);
  }

  // Seed default showcase data
  const initialData: DashboardStorageData = {
    userId: userId || "00000000-0000-0000-0000-000000000000",
    totalInterviewsGiven: DEFAULT_SHOWCASE_SESSIONS.length,
    completedInterviews: DEFAULT_SHOWCASE_SESSIONS.length,
    avgScore: 88,
    topScore: 94,
    totalQuestionsAnswered: 4,
    sessions: DEFAULT_SHOWCASE_SESSIONS,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(initialData));
  } catch {}

  return initialData;
}

/**
 * Save updated dashboard data to localStorage
 */
export function saveStoredDashboardData(data: DashboardStorageData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save dashboard data to localStorage:", err);
  }
}

/**
 * Add or update a session in localStorage and update stats
 */
export function recordSessionInStorage(session: EnrichedSession): DashboardStorageData {
  const current = getStoredDashboardData(session.user_id);
  const existingIdx = current.sessions.findIndex((s) => s.id === session.id);

  let updatedSessions: EnrichedSession[];
  if (existingIdx >= 0) {
    updatedSessions = [...current.sessions];
    updatedSessions[existingIdx] = { ...updatedSessions[existingIdx], ...session };
  } else {
    updatedSessions = [session, ...current.sessions];
  }

  const stats = computeStatsFromSessions(updatedSessions);

  const updatedData: DashboardStorageData = {
    userId: session.user_id,
    totalInterviewsGiven: stats.totalSessions,
    completedInterviews: stats.completedSessions,
    avgScore: stats.avgScore,
    topScore: stats.topScore,
    totalQuestionsAnswered: stats.totalQuestionsAnswered,
    sessions: updatedSessions,
    lastUpdated: new Date().toISOString(),
  };

  saveStoredDashboardData(updatedData);
  return updatedData;
}

/**
 * Reset localStorage dashboard data to showcase defaults
 */
export function resetStoredDashboardData(userId?: string): DashboardStorageData {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
  }
  return getStoredDashboardData(userId);
}
