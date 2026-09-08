import { GoogleGenAI } from "@google/genai";

export interface GeneratedQuestion {
  prompt: string;
  category: "behavioral" | "technical" | "system-design" | "resume-deep-dive" | "role-specific";
  difficulty?: "entry" | "mid" | "senior";
  tailoredFromResume: boolean;
  resumeContextSnippet?: string;
  rubricCriteria?: string[];
}

export interface AnswerEvaluation {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  modelAnswerSnippet?: string;
  followUpTip?: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY in environment. Please add your GEMINI_API_KEY to backend/.env."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate role-specific and resume-grounded mock interview questions using Gemini.
 */
export async function generateQuestions(params: {
  role: string;
  domain?: string;
  difficulty?: string;
  resumeChunks?: string[];
  resumeText?: string;
  count?: number;
}): Promise<GeneratedQuestion[]> {
  const { role, domain, difficulty = "mid", resumeChunks = [], resumeText, count = 5 } = params;

  const ai = getGeminiClient();

  const systemInstruction = `You are a Principal Hiring Manager and Elite Technical Interview Coach at a top technology firm.
Your task is to craft high-yield, realistic mock interview questions.
Rules:
1. Ground the interview in the candidate's actual resume experience whenever resume context is provided.
2. If resume context or chunks are provided, generate questions that directly probe their past projects, architectural decisions, metrics, and technologies.
3. Mix behavioral, deep technical, system-design, and resume-deep-dive questions appropriately for the candidate's target role.
4. Return strictly valid JSON formatted as an array of objects conforming to:
[
  {
    "prompt": "Clear, engaging interview question",
    "category": "technical" | "system-design" | "behavioral" | "resume-deep-dive" | "role-specific",
    "difficulty": "entry" | "mid" | "senior",
    "tailoredFromResume": boolean,
    "resumeContextSnippet": "The exact bullet point, skill, or project from their resume this is based on (or null if general)",
    "rubricCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
  }
]
Do NOT wrap output in markdown code blocks or add explanatory conversational text. Output pure JSON only.`;

  const contextBlocks: string[] = [
    `Target Role: ${role}`,
    domain ? `Specialization/Domain: ${domain}` : "",
    `Target Difficulty: ${difficulty}`,
    `Number of questions to generate: ${count}`,
  ].filter(Boolean);

  if (resumeChunks.length > 0) {
    contextBlocks.push(
      `Candidate Resume Context (Retrieved via Pinecone Vector Database Semantic Search):\n${resumeChunks
        .map((c, i) => `[Resume Excerpt ${i + 1}]:\n${c}`)
        .join("\n\n")}`
    );
  } else if (resumeText) {
    contextBlocks.push(`Candidate Resume Summary:\n${resumeText.slice(0, 5000)}`);
  }

  const userPrompt = contextBlocks.join("\n\n");

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const rawText = response.text?.trim() || "[]";
    const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as GeneratedQuestion[];

    return parsed.map((q) => ({
      prompt: q.prompt,
      category: q.category || "role-specific",
      difficulty: q.difficulty || "mid",
      tailoredFromResume: Boolean(q.tailoredFromResume || q.resumeContextSnippet),
      resumeContextSnippet: q.resumeContextSnippet || undefined,
      rubricCriteria: q.rubricCriteria || [],
    }));
  } catch (err) {
    console.error("Gemini question generation error:", err);
    throw new Error(
      `Failed to generate questions with Gemini: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Evaluates candidate's written or spoken answer using Gemini.
 */
export async function evaluateAnswer(params: {
  question: string;
  answer: string;
  role: string;
  category?: string;
  rubricCriteria?: string[];
}): Promise<AnswerEvaluation> {
  const { question, answer, role, category, rubricCriteria = [] } = params;

  const ai = getGeminiClient();

  const systemInstruction = `You are a supportive yet rigorous FAANG/Top-tier Senior Interviewer and Executive Communication Coach.
Evaluate the candidate's interview response with honesty, precision, and actionable coaching.

Scoring Scale (0-100):
- 90-100: Exceptional. Clear structured communication (STAR/Tradeoffs), deep technical accuracy, concrete metrics.
- 75-89: Strong. Good domain knowledge, clear points, minor gaps in depth or structure.
- 60-74: Adequate but needs improvement. Vague assertions, lack of specific examples, or disorganized structure.
- <60: Insufficient. Missed the core question or lacked technical accuracy.

Return strictly valid JSON conforming to:
{
  "score": number (0-100),
  "strengths": ["Clear strength 1", "Clear strength 2"],
  "weaknesses": ["Specific actionable improvement 1", "Specific actionable improvement 2"],
  "feedback": "2-4 sentences of coaching on tone, structure, and technical depth",
  "modelAnswerSnippet": "A concise 3-4 sentence exemplar illustrating how a senior candidate would phrase this answer",
  "followUpTip": "Quick strategic tip (e.g. use STAR method, mention scaling limits, state business impact)"
}
Do NOT wrap output in markdown code blocks or add conversational prose. Output pure JSON only.`;

  const userContent = [
    `Target Role: ${role}`,
    category ? `Category: ${category}` : "",
    rubricCriteria.length > 0 ? `Expected Key Points:\n- ${rubricCriteria.join("\n- ")}` : "",
    `Interview Question: "${question}"`,
    `Candidate Answer: "${answer}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const rawText = response.text?.trim() || "{}";
    const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as AnswerEvaluation;

    return {
      score: Math.min(100, Math.max(0, Math.round(parsed.score || 0))),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      feedback: parsed.feedback || "Answer recorded.",
      modelAnswerSnippet: parsed.modelAnswerSnippet || undefined,
      followUpTip: parsed.followUpTip || undefined,
    };
  } catch (err) {
    console.error("Gemini answer evaluation error:", err);
    throw new Error(
      `Failed to evaluate answer with Gemini: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Generate vector embedding for a single text using Gemini embedding model.
 */
export async function generateEmbedding(text: string, dimension: number = 1024): Promise<number[]> {
  const ai = getGeminiClient();
  const res = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: dimension,
    },
  });

  const values = res.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Failed to generate embedding from Gemini API");
  }
  return values;
}

/**
 * Generate embeddings for multiple text chunks in batch with custom output dimensionality.
 */
export async function generateBatchEmbeddings(texts: string[], dimension: number = 1024): Promise<number[][]> {
  const ai = getGeminiClient();
  const results: number[][] = [];

  // Batch in chunks of 5 to respect rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunkBatch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      chunkBatch.map(async (content) => {
        const res = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: content,
          config: {
            outputDimensionality: dimension,
          },
        });
        return res.embeddings?.[0]?.values ?? [];
      })
    );
    results.push(...batchResults);
  }

  return results;
}
