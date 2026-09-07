import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY. Copy .env.example to .env and fill it in.");
}

const anthropic = new Anthropic({ apiKey });
const MODEL = "claude-sonnet-4-6";

export interface GeneratedQuestion {
  prompt: string;
  category: "behavioral" | "technical" | "system-design" | "role-specific";
}

/**
 * Generates role-specific (and optionally resume-aware) interview questions.
 */
export async function generateQuestions(params: {
  role: string;
  domain?: string;
  resumeText?: string;
  count?: number;
}): Promise<GeneratedQuestion[]> {
  const { role, domain, resumeText, count = 5 } = params;

  const system = `You generate mock interview questions for job candidates.
Return ONLY a JSON array, no prose, no markdown fences.
Each item: { "prompt": string, "category": "behavioral" | "technical" | "system-design" | "role-specific" }.
Mix categories sensibly for the target role. Keep each prompt to one clear question.`;

  const userContent = [
    `Target role: ${role}`,
    domain ? `Domain: ${domain}` : null,
    resumeText ? `Candidate resume (use it to tailor some questions):\n${resumeText.slice(0, 6000)}` : null,
    `Generate ${count} interview questions.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const cleaned = text.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned) as GeneratedQuestion[];
}

export interface AnswerEvaluation {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

/**
 * Evaluates a candidate's answer to a specific interview question.
 */
export async function evaluateAnswer(params: {
  question: string;
  answer: string;
  role: string;
}): Promise<AnswerEvaluation> {
  const { question, answer, role } = params;

  const system = `You are an expert interview coach evaluating a candidate's spoken/written answer.
Return ONLY a JSON object, no prose, no markdown fences.
Shape: { "score": number (0-100), "strengths": string[], "weaknesses": string[], "feedback": string }.
Be specific and constructive. "feedback" should be 2-4 sentences of actionable advice.`;

  const userContent = `Target role: ${role}\n\nQuestion: ${question}\n\nCandidate's answer: ${answer}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const cleaned = text.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned) as AnswerEvaluation;
}
