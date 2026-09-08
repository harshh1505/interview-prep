import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ProfileRecord {
  id: string;
  full_name?: string;
  target_role?: string;
  resume_text?: string;
  created_at?: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  role: string;
  domain?: string;
  status: "in_progress" | "completed" | "abandoned";
  overall_score?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface QuestionRecord {
  id: string;
  session_id: string;
  order_index: number;
  prompt: string;
  category?: string;
  tailored_from_resume?: boolean;
  resume_snippet?: string;
  rubric_criteria?: string[];
  created_at: string;
}

export interface AnswerRecord {
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
  created_at: string;
}

interface LocalStoreSchema {
  profiles: ProfileRecord[];
  sessions: SessionRecord[];
  questions: QuestionRecord[];
  answers: AnswerRecord[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

let supabaseClient: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http") && !supabaseUrl.includes("your-project")) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log("[Storage] Connected to Supabase Postgres.");
  } catch (err) {
    console.warn("[Storage] Failed to initialize Supabase, falling back to local file store:", err);
  }
} else {
  console.log("[Storage] Supabase keys not set. Using local file store (backend/data/store.json).");
}

function loadLocalStore(): LocalStoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initialData: LocalStoreSchema = {
        profiles: [
          {
            id: DEV_USER_ID,
            full_name: "Candidate",
            target_role: "Software Engineer",
            created_at: new Date().toISOString(),
          },
        ],
        sessions: [],
        questions: [],
        answers: [],
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw) as LocalStoreSchema;
  } catch (err) {
    console.error("[Storage] Error reading local store:", err);
    return { profiles: [], sessions: [], questions: [], answers: [] };
  }
}

function saveLocalStore(data: LocalStoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Error saving local store:", err);
  }
}

export const storage = {
  async getProfile(userId: string): Promise<ProfileRecord | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) return data as ProfileRecord;
    }
    const local = loadLocalStore();
    return local.profiles.find((p) => p.id === userId) || null;
  },

  async saveResumeText(userId: string, resumeText: string): Promise<void> {
    if (supabaseClient) {
      await supabaseClient
        .from("profiles")
        .upsert({ id: userId, resume_text: resumeText }, { onConflict: "id" });
      return;
    }
    const local = loadLocalStore();
    const existing = local.profiles.find((p) => p.id === userId);
    if (existing) {
      existing.resume_text = resumeText;
    } else {
      local.profiles.push({
        id: userId,
        resume_text: resumeText,
        created_at: new Date().toISOString(),
      });
    }
    saveLocalStore(local);
  },

  async createSession(params: {
    userId: string;
    role: string;
    domain?: string;
  }): Promise<SessionRecord> {
    const session: SessionRecord = {
      id: crypto.randomUUID(),
      user_id: params.userId,
      role: params.role,
      domain: params.domain,
      status: "in_progress",
      overall_score: null,
      created_at: new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .insert({
          user_id: params.userId,
          role: params.role,
          domain: params.domain,
        })
        .select()
        .single();
      if (!error && data) return data as SessionRecord;
      console.warn("[Storage] Supabase createSession failed, saving locally:", error);
    }

    const local = loadLocalStore();
    local.sessions.push(session);
    saveLocalStore(local);
    return session;
  },

  async getSession(id: string): Promise<SessionRecord | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) return data as SessionRecord;
    }
    const local = loadLocalStore();
    return local.sessions.find((s) => s.id === id) || null;
  },

  async listSessions(userId: string): Promise<SessionRecord[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) return data as SessionRecord[];
    }
    const local = loadLocalStore();
    return local.sessions
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateSession(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as SessionRecord;
    }
    const local = loadLocalStore();
    const s = local.sessions.find((sess) => sess.id === id);
    if (!s) return null;
    Object.assign(s, updates);
    saveLocalStore(local);
    return s;
  },

  async insertQuestions(questions: Omit<QuestionRecord, "id" | "created_at">[]): Promise<QuestionRecord[]> {
    const rows: QuestionRecord[] = questions.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("questions")
        .insert(
          rows.map((r) => ({
            session_id: r.session_id,
            order_index: r.order_index,
            prompt: r.prompt,
            category: r.category,
          }))
        )
        .select();
      if (!error && data) return data as QuestionRecord[];
      console.warn("[Storage] Supabase insertQuestions failed, saving locally:", error);
    }

    const local = loadLocalStore();
    local.questions.push(...rows);
    saveLocalStore(local);
    return rows;
  },

  async getQuestions(sessionId: string): Promise<QuestionRecord[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index");
      if (!error && data) return data as QuestionRecord[];
    }
    const local = loadLocalStore();
    return local.questions
      .filter((q) => q.session_id === sessionId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  async getQuestion(id: string): Promise<QuestionRecord | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) return data as QuestionRecord;
    }
    const local = loadLocalStore();
    return local.questions.find((q) => q.id === id) || null;
  },

  async insertAnswer(data: Omit<AnswerRecord, "id" | "created_at">): Promise<AnswerRecord> {
    const answer: AnswerRecord = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data: inserted, error } = await supabaseClient
        .from("answers")
        .insert({
          question_id: data.question_id,
          session_id: data.session_id,
          answer_text: data.answer_text,
          score: data.score,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          feedback: data.feedback,
        })
        .select()
        .single();
      if (!error && inserted) {
        return {
          ...inserted,
          model_answer: data.model_answer,
          follow_up_tip: data.follow_up_tip,
        } as AnswerRecord;
      }
      console.warn("[Storage] Supabase insertAnswer failed, saving locally:", error);
    }

    const local = loadLocalStore();
    local.answers.push(answer);
    saveLocalStore(local);
    return answer;
  },

  async getAnswers(sessionId: string): Promise<AnswerRecord[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from("answers")
        .select("*")
        .eq("session_id", sessionId);
      if (!error && data) return data as AnswerRecord[];
    }
    const local = loadLocalStore();
    return local.answers.filter((a) => a.session_id === sessionId);
  },
};
