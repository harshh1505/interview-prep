import { Pinecone } from "@pinecone-database/pinecone";
import { generateBatchEmbeddings, generateEmbedding } from "./gemini";

export interface ResumeChunk {
  id: string;
  text: string;
  chunkIndex: number;
  section: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  section: string;
  score: number;
}

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX || "interview-prep";
const PINECONE_HOST = process.env.PINECONE_HOST;

// In-memory fallback store in case PINECONE_API_KEY is not yet provided or during offline test
interface StoredVector {
  id: string;
  userId: string;
  vector: number[];
  text: string;
  section: string;
  chunkIndex: number;
}
const localVectorStore: StoredVector[] = [];

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let pineconeClient: Pinecone | null = null;
let cachedDimension: number | null = null;

export function getPineconeClient(): Pinecone | null {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-pinecone-api-key") {
    return null;
  }
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Returns the target Pinecone index instance (using PINECONE_HOST if provided, or index name).
 */
export function getPineconeIndex() {
  const client = getPineconeClient();
  if (!client) return null;
  if (PINECONE_HOST && PINECONE_HOST.trim() !== "") {
    return client.index({ host: PINECONE_HOST.trim() });
  }
  return client.index(PINECONE_INDEX_NAME);
}

/**
 * Dynamically resolves the dimension of the target Pinecone index (e.g. 1024 or 768)
 * to ensure Gemini embeddings align with Pinecone index specs.
 */
export async function getEffectiveDimension(): Promise<number> {
  if (cachedDimension) return cachedDimension;
  const index = getPineconeIndex();
  if (index) {
    try {
      const stats = await index.describeIndexStats();
      if (stats && stats.dimension) {
        cachedDimension = stats.dimension;
        console.log(`[Pinecone] Resolved index dimension from host/stats: ${cachedDimension}`);
        return cachedDimension;
      }
    } catch {
      // fallback
    }
  }

  const client = getPineconeClient();
  if (client) {
    try {
      const desc = await client.describeIndex(PINECONE_INDEX_NAME);
      if (desc && desc.dimension) {
        cachedDimension = desc.dimension;
        return cachedDimension;
      }
    } catch {
      // index might need to be created
    }
  }
  return 1024;
}

/**
 * Ensures the Pinecone serverless index exists.
 */
export async function ensurePineconeIndex(): Promise<string> {
  const client = getPineconeClient();
  if (!client) {
    return "local-memory";
  }

  // If host is explicitly set, the index is already active
  if (PINECONE_HOST && PINECONE_HOST.trim() !== "") {
    await getEffectiveDimension();
    return PINECONE_INDEX_NAME;
  }

  try {
    const list = await client.listIndexes();
    const exists = list.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

    if (!exists) {
      console.log(`[Pinecone] Creating serverless index "${PINECONE_INDEX_NAME}" with 1024 dimensions...`);
      await client.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: 1024,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
        waitUntilReady: true,
      });
      cachedDimension = 1024;
      console.log(`[Pinecone] Index "${PINECONE_INDEX_NAME}" successfully created and ready.`);
    } else {
      await getEffectiveDimension();
    }

    return PINECONE_INDEX_NAME;
  } catch (err) {
    console.warn(`[Pinecone] Warning while verifying index:`, err instanceof Error ? err.message : err);
    return PINECONE_INDEX_NAME;
  }
}

/**
 * Intelligent section-aware resume chunker.
 * Identifies resume sections (Experience, Projects, Skills, Education)
 * and splits into coherent semantic chunks with overlap.
 */
export function chunkResumeText(text: string): { text: string; section: string }[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  // Common resume section headers
  const sectionKeywords: { [key: string]: RegExp } = {
    experience: /(?:work\s+experience|professional\s+experience|employment\s+history|experience)\b/i,
    projects: /(?:projects|personal\s+projects|academic\s+projects|key\s+projects)\b/i,
    skills: /(?:technical\s+skills|skills\s*(?:&|and)\s*tools|core\s+competencies|technologies|skills)\b/i,
    education: /(?:education|academic\s+background|degrees|certifications|courses)\b/i,
    summary: /(?:summary|professional\s+summary|about\s+me|profile)\b/i,
  };

  const lines = clean.split("\n");
  const sections: { section: string; lines: string[] }[] = [];
  let currentSection = "summary";
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matchedSection: string | null = null;
    if (trimmed.length < 50) {
      for (const [secName, regex] of Object.entries(sectionKeywords)) {
        if (regex.test(trimmed)) {
          matchedSection = secName;
          break;
        }
      }
    }

    if (matchedSection) {
      if (currentLines.length > 0) {
        sections.push({ section: currentSection, lines: currentLines });
        currentLines = [];
      }
      currentSection = matchedSection;
    } else {
      currentLines.push(trimmed);
    }
  }

  if (currentLines.length > 0) {
    sections.push({ section: currentSection, lines: currentLines });
  }

  const chunks: { text: string; section: string }[] = [];
  const TARGET_CHUNK_CHARS = 800;
  const OVERLAP_CHARS = 120;

  for (const sec of sections) {
    const sectionBody = sec.lines.join("\n");
    if (sectionBody.length <= TARGET_CHUNK_CHARS) {
      chunks.push({
        text: `[Section: ${sec.section.toUpperCase()}]\n${sectionBody}`,
        section: sec.section,
      });
      continue;
    }

    let start = 0;
    while (start < sectionBody.length) {
      let end = start + TARGET_CHUNK_CHARS;
      if (end < sectionBody.length) {
        const nextBreak = sectionBody.lastIndexOf("\n", end);
        if (nextBreak > start + 300) {
          end = nextBreak;
        }
      } else {
        end = sectionBody.length;
      }

      const chunkSlice = sectionBody.slice(start, end).trim();
      if (chunkSlice.length > 50) {
        chunks.push({
          text: `[Section: ${sec.section.toUpperCase()}]\n${chunkSlice}`,
          section: sec.section,
        });
      }

      if (end >= sectionBody.length) break;
      start = Math.max(start + 1, end - OVERLAP_CHARS);
    }
  }

  return chunks.length > 0 ? chunks : [{ text: clean.slice(0, 1000), section: "general" }];
}

/**
 * Chunks resume, generates Gemini embeddings matching Pinecone index dimension,
 * and upserts them to Pinecone (or fallback).
 */
export async function indexResumeChunks(params: {
  userId: string;
  resumeText: string;
  fileName?: string;
}): Promise<{ chunkCount: number; sampleChunks: string[]; sections: string[]; storage: "pinecone" | "local" }> {
  const { userId, resumeText, fileName } = params;

  const rawChunks = chunkResumeText(resumeText);
  if (rawChunks.length === 0) {
    throw new Error("No text content could be extracted from resume.");
  }

  console.log(`[Pinecone] Generated ${rawChunks.length} chunks for candidate ${userId}. Embedding with Gemini...`);

  // Ensure index & retrieve target dimension (e.g. 1024 or 768)
  await ensurePineconeIndex();
  const dimension = await getEffectiveDimension();

  // Generate embeddings for all chunks via Gemini
  const textsToEmbed = rawChunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(textsToEmbed, dimension);

  const index = getPineconeIndex();
  let usedStorage: "pinecone" | "local" = "local";

  if (index) {
    try {
      const namespace = `user-${userId}`;

      const vectors = rawChunks.map((c, i) => ({
        id: `${userId}-chunk-${i}`,
        values: embeddings[i],
        metadata: {
          text: c.text,
          chunkIndex: i,
          section: c.section,
          userId,
          fileName: fileName || "resume.pdf",
        },
      }));

      // Upsert in batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        const batch = vectors.slice(i, i + BATCH_SIZE);
        await index.namespace(namespace).upsert({ records: batch });
      }

      usedStorage = "pinecone";
      console.log(`[Pinecone] Successfully indexed ${vectors.length} vectors (${dimension}-dim) into namespace "${namespace}".`);
    } catch (err) {
      console.warn(`[Pinecone] Upsert to Pinecone failed, falling back to local vector memory:`, err);
      usedStorage = "local";
    }
  } else {
    console.log(`[Pinecone] PINECONE_API_KEY not configured. Storing ${rawChunks.length} embeddings in local vector memory.`);
    usedStorage = "local";
  }

  // Store in localVectorStore as well for backup / offline queries
  for (let i = localVectorStore.length - 1; i >= 0; i--) {
    if (localVectorStore[i].userId === userId) {
      localVectorStore.splice(i, 1);
    }
  }

  rawChunks.forEach((c, i) => {
    localVectorStore.push({
      id: `${userId}-chunk-${i}`,
      userId,
      vector: embeddings[i],
      text: c.text,
      section: c.section,
      chunkIndex: i,
    });
  });

  const sections = Array.from(new Set(rawChunks.map((c) => c.section)));
  const sampleChunks = rawChunks.slice(0, 3).map((c) => c.text);

  return {
    chunkCount: rawChunks.length,
    sampleChunks,
    sections,
    storage: usedStorage,
  };
}

/**
 * Performs semantic similarity search against the user's chunked resume in Pinecone.
 */
export async function queryResumeContext(params: {
  userId: string;
  query: string;
  topK?: number;
}): Promise<RetrievedChunk[]> {
  const { userId, query, topK = 5 } = params;

  // Resolve target index dimension and generate query embedding via Gemini
  const dimension = await getEffectiveDimension();
  const queryEmbedding = await generateEmbedding(query, dimension);

  const index = getPineconeIndex();
  if (index) {
    try {
      const namespace = `user-${userId}`;

      const response = await index.namespace(namespace).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      if (response.matches && response.matches.length > 0) {
        return response.matches.map((m) => ({
          id: m.id,
          text: (m.metadata?.text as string) || "",
          section: (m.metadata?.section as string) || "general",
          score: m.score ?? 1.0,
        }));
      }
    } catch (err) {
      console.warn(`[Pinecone] Vector query against Pinecone failed, falling back to local memory:`, err);
    }
  }

  // Fallback to local memory cosine similarity
  const userVectors = localVectorStore.filter((v) => v.userId === userId);
  if (userVectors.length === 0) {
    return [];
  }

  const scored = userVectors.map((item) => ({
    id: item.id,
    text: item.text,
    section: item.section,
    score: cosineSimilarity(queryEmbedding, item.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
