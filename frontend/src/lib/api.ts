const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export interface Question {
  id: string;
  prompt: string;
  category: string;
  order_index: number;
}

export interface Session {
  id: string;
  role: string;
  domain?: string;
  status: string;
  overall_score?: number;
  created_at: string;
}

export async function createSession(params: {
  userId: string;
  role: string;
  domain?: string;
  useResume?: boolean;
}): Promise<{ session: Session; questions: Question[] }> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function getSession(id: string) {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!res.ok) throw new Error("Failed to load session");
  return res.json();
}

export async function listSessions(userId: string): Promise<{ sessions: Session[] }> {
  const res = await fetch(`${API_BASE}/api/sessions?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to load sessions");
  return res.json();
}

export async function submitAnswer(params: { questionId: string; sessionId: string; answerText: string }) {
  const res = await fetch(`${API_BASE}/api/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to submit answer");
  return res.json();
}

export async function completeSession(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/answers/${sessionId}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to complete session");
  return res.json();
}

export async function uploadResume(userId: string, file: File) {
  const form = new FormData();
  form.append("userId", userId);
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/resume/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload resume");
  return res.json();
}
