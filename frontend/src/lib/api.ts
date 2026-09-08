const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export interface Question {
  id: string;
  prompt: string;
  category: string;
  order_index: number;
  tailored_from_resume?: boolean;
  resume_snippet?: string;
  rubric_criteria?: string[];
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  session_id: string;
  answer_text: string;
  score?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  model_answer?: string;
  follow_up_tip?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  role: string;
  domain?: string;
  status: "in_progress" | "completed" | "abandoned";
  overall_score?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ResumeUploadResult {
  ok: boolean;
  extractedChars: number;
  chunkCount: number;
  sections: string[];
  sampleChunks: string[];
  storage: "pinecone" | "local";
  message: string;
}

export interface ApiHealth {
  ok: boolean;
  services: {
    gemini: "configured" | "missing_key";
    pinecone: "configured" | "using_local_fallback";
  };
  version: string;
}

export async function checkApiHealth(): Promise<ApiHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}

export async function createSession(params: {
  userId: string;
  role: string;
  domain?: string;
  difficulty?: "entry" | "mid" | "senior";
  useResume?: boolean;
  questionCount?: number;
}): Promise<{ session: Session; questions: Question[]; retrievedChunksCount?: number }> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create session");
  }
  return res.json();
}

export async function getSession(id: string): Promise<{ session: Session; questions: Question[] }> {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!res.ok) throw new Error("Failed to load session");
  return res.json();
}

export async function listSessions(userId: string): Promise<{ sessions: Session[] }> {
  const res = await fetch(`${API_BASE}/api/sessions?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to load sessions");
  return res.json();
}

export async function submitAnswer(params: {
  questionId: string;
  sessionId: string;
  answerText: string;
}): Promise<{ answer: Answer }> {
  const res = await fetch(`${API_BASE}/api/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to submit answer");
  }
  return res.json();
}

export async function completeSession(sessionId: string): Promise<{ session: Session }> {
  const res = await fetch(`${API_BASE}/api/answers/${sessionId}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to complete session");
  return res.json();
}

export async function uploadResume(userId: string, file: File): Promise<ResumeUploadResult> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/resume/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload and index resume");
  }
  return res.json();
}

export async function getResumeStatus(userId: string): Promise<{
  hasResume: boolean;
  charCount: number;
  preview: string | null;
}> {
  const res = await fetch(`${API_BASE}/api/resume/status?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to check resume status");
  return res.json();
}
