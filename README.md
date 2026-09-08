# AI-Powered Interview Preparation System (Gemini + Pinecone Edition)

Role-specific mock interview platform powered by **Google Gemini** for reasoning, grounded question generation, and coaching evaluation, combined with **Pinecone Vector Database** for semantic resume chunking and vector retrieval.

Includes an **Interactive Voice Interview Mode** where the AI interviewer speaks questions aloud and listens to spoken candidate answers in real time.

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Web Speech API (Text-to-Speech & Speech-to-Text)
- **Backend**: Node.js + Express + TypeScript
- **LLM & Embeddings**: Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`) via `@google/genai`
- **Vector Database**: Pinecone Serverless Index (`@pinecone-database/pinecone`)
- **Storage**: Hybrid engine — zero-config local JSON persistence (`backend/data/store.json`) with seamless Supabase Postgres support

## Architecture

1. **Resume Ingestion & Pinecone Chunking**:
   - PDF resumes are parsed and split into section-aware semantic chunks (`Experience`, `Projects`, `Skills`, `Education`, `Summary`).
   - Each chunk is embedded with Gemini into vector embeddings and upserted into Pinecone partitioned by user namespace (`user-${userId}`).
2. **Grounded Question Generation**:
   - Vector similarity search retrieves candidate projects and achievements relevant to the target role.
   - Google Gemini crafts high-yield interview questions explicitly grounded in the candidate's actual background.
3. **Interactive Voice Mode**:
   - AI agent speaks the question aloud with animated waveforms.
   - Auto-mic activates for candidate speech dictation.
4. **Answer Evaluation & Coaching**:
   - Gemini scores answers (0–100) with key strengths, areas for improvement, actionable advice, and an exemplary senior-candidate model answer.

## Setup & Running

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Add your keys to `backend/.env`:
```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000

# Google Gemini API Key (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=interview-prep
PINECONE_HOST=https://your-index-host.pinecone.io  # optional
```

Install and start:
```bash
npm install
npm run dev    # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000 (or 3001)
```

## Available Pages

- **`/`**: Landing page overview.
- **`/upload`**: Setup session, choose role presets, select difficulty, and upload PDF resume for Pinecone indexing.
- **`/interview/[sessionId]`**: Interactive voice interview room with speech synthesis, voice dictation, timer, and Gemini evaluation.
- **`/dashboard`**: Session analytics, average score, and past interview history.
