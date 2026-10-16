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

export interface ResumeAnalysisResult {
  summary: string;
  skills: string[];
  technologies: string[];
  projects: Array<{ title: string; description: string; tech?: string[]; role?: string }>;
  experience: Array<{ company: string; role: string; duration?: string; description?: string }>;
  interview_topics: string[];
  potential_weaknesses: string[];
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  const ai = getGeminiClient();

  const systemInstruction = `You are an expert Executive Technical Recruiter and Resume Analytics Engine.
Analyze the candidate's full resume text and extract structured profile data.

Return strictly valid JSON matching this schema:
{
  "summary": "2-3 sentence high-level executive summary of candidate background, experience level, and domain focus",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "technologies": ["Tech/Tool 1", "Tech/Tool 2", "Framework 1"],
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description of project accomplishments, architecture, and impact",
      "tech": ["Tech 1", "Tech 2"],
      "role": "Role played"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Dates/Duration",
      "description": "Key responsibilities and achievements"
    }
  ],
  "interview_topics": ["Topic/Focus Area 1", "Topic/Focus Area 2"],
  "potential_weaknesses": ["Potential gap or area to probe in interview 1", "Potential gap 2"]
}
Output pure JSON only, without markdown backticks.`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Candidate Resume Text:\n\n${resumeText.slice(0, 10000)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text?.trim() || "{}";
    const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as ResumeAnalysisResult;

    return {
      summary: parsed.summary || "Resume parsed successfully.",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      interview_topics: Array.isArray(parsed.interview_topics) ? parsed.interview_topics : [],
      potential_weaknesses: Array.isArray(parsed.potential_weaknesses) ? parsed.potential_weaknesses : [],
    };
  } catch (err) {
    console.error("Error analyzing resume with Gemini:", err);
    return {
      summary: "Resume processed successfully.",
      skills: ["Software Engineering", "Problem Solving"],
      technologies: ["TypeScript", "JavaScript", "SQL"],
      projects: [],
      experience: [],
      interview_topics: ["System Architecture", "Technical Execution"],
      potential_weaknesses: ["Deep-dive domain edge cases"],
    };
  }
}

export interface DetailedInterviewReport {
  overall_score: number;
  technical_accuracy: number;
  communication_clarity: number;
  depth_of_explanation: number;
  resume_consistency: number;
  key_strengths: string[];
  areas_for_improvement: string[];
  summary_feedback: string;
  topic_breakdown: Record<string, number>;
  question_evaluations: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
  }>;
}

export async function generateInterviewReport(params: {
  role: string;
  domain?: string;
  resumeSummary?: string;
  qas: Array<{
    question: string;
    category?: string;
    answer: string;
    score?: number | null;
    strengths?: string[];
    weaknesses?: string[];
    feedback?: string;
  }>;
}): Promise<DetailedInterviewReport> {
  const ai = getGeminiClient();

  const systemInstruction = `You are an Executive Technical Interview Panel Director.
Synthesize the entire interview performance of the candidate into a comprehensive, multi-dimensional performance report.

Calculate overall score and specific dimension scores (0-100):
- technical_accuracy: correctness, domain concepts, algorithm design, system architectural knowledge.
- communication_clarity: structure (STAR method), conciseness, articulate articulation.
- depth_of_explanation: ability to explain tradeoffs, edge cases, underlying mechanics, scaling limits.
- resume_consistency: alignment between claimed resume experience/skills and actual answers provided.

Return strictly valid JSON conforming to:
{
  "overall_score": number (0-100),
  "technical_accuracy": number (0-100),
  "communication_clarity": number (0-100),
  "depth_of_explanation": number (0-100),
  "resume_consistency": number (0-100),
  "key_strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areas_for_improvement": ["Actionable improvement area 1", "Area 2"],
  "summary_feedback": "3-4 paragraph thorough executive summary evaluating readiness for the role.",
  "topic_breakdown": { "System Design": 85, "Algorithms": 78, "Resume Experience": 90 },
  "question_evaluations": [
    {
      "question": "Question text",
      "answer": "Candidate answer snippet",
      "score": number,
      "feedback": "Coaching feedback",
      "strengths": ["strength"],
      "weaknesses": ["weakness"]
    }
  ]
}
Output pure JSON only without markdown code blocks.`;

  const promptText = `Target Role: ${params.role}
${params.domain ? `Domain: ${params.domain}` : ""}
${params.resumeSummary ? `Candidate Resume Context: ${params.resumeSummary}` : ""}

Interview Questions & Candidate Answers:
${params.qas
  .map(
    (item, idx) => `
Q${idx + 1} (${item.category || "general"}): "${item.question}"
Candidate Answer: "${item.answer}"
Score: ${item.score ?? "N/A"}
Strengths: ${item.strengths?.join(", ") || "N/A"}
Weaknesses: ${item.weaknesses?.join(", ") || "N/A"}
Evaluation Feedback: ${item.feedback || "N/A"}
`
  )
  .join("\n---")}`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const rawText = response.text?.trim() || "{}";
    const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as DetailedInterviewReport;

    const qEvals = params.qas.map((item) => ({
      question: item.question,
      answer: item.answer,
      score: typeof item.score === "number" ? item.score : 70,
      feedback: item.feedback || "Answer recorded.",
      strengths: item.strengths || [],
      weaknesses: item.weaknesses || [],
    }));

    const avgScore =
      qEvals.length > 0
        ? Math.round(qEvals.reduce((acc, q) => acc + q.score, 0) / qEvals.length)
        : 75;

    return {
      overall_score: Math.round(parsed.overall_score ?? avgScore),
      technical_accuracy: Math.round(parsed.technical_accuracy ?? avgScore),
      communication_clarity: Math.round(parsed.communication_clarity ?? avgScore),
      depth_of_explanation: Math.round(parsed.depth_of_explanation ?? avgScore),
      resume_consistency: Math.round(parsed.resume_consistency ?? avgScore),
      key_strengths: Array.isArray(parsed.key_strengths) ? parsed.key_strengths : ["Clear problem solving"],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ["Expand on edge cases"],
      summary_feedback: parsed.summary_feedback || "The candidate demonstrated solid overall competency.",
      topic_breakdown: parsed.topic_breakdown || { Technical: avgScore, Communication: avgScore },
      question_evaluations: parsed.question_evaluations || qEvals,
    };
  } catch (err) {
    console.error("Gemini report generation error:", err);
    const qEvals = params.qas.map((item) => ({
      question: item.question,
      answer: item.answer,
      score: typeof item.score === "number" ? item.score : 75,
      feedback: item.feedback || "Answer recorded.",
      strengths: item.strengths || ["Engaged directly with question"],
      weaknesses: item.weaknesses || ["Could provide deeper architectural tradeoffs"],
    }));
    const avgScore =
      qEvals.length > 0
        ? Math.round(qEvals.reduce((acc, q) => acc + q.score, 0) / qEvals.length)
        : 75;

    return {
      overall_score: avgScore,
      technical_accuracy: avgScore,
      communication_clarity: avgScore,
      depth_of_explanation: avgScore,
      resume_consistency: avgScore,
      key_strengths: ["Solid foundational knowledge", "Structured communication"],
      areas_for_improvement: ["Provide more explicit performance metrics and trade-off analysis"],
      summary_feedback: "Completed mock interview session. Resume experience was referenced effectively.",
      topic_breakdown: { "Technical Mastery": avgScore, Communication: avgScore },
      question_evaluations: qEvals,
    };
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

