# AI-Powered Interview Preparation System

Working scaffold for the platform described in your project pitch: role-specific
AI-generated interview questions, real-time mock interview sessions, automated
answer evaluation, and session history — for students preparing for placements.

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (Postgres + Row Level Security + Auth)
- **LLM**: Anthropic Claude (question generation + answer evaluation)

## Structure

```
interview-prep/
  backend/     Express API — resume parsing, question generation, evaluation
  frontend/    Next.js app — upload, interview session, dashboard
  supabase/    schema.sql — run this once on a fresh Supabase project
```

## Setup

1. **Supabase**
   - Create a project at supabase.com.
   - Open the SQL editor and run `supabase/schema.sql`.
   - Grab your Project URL and `service_role` key from Settings → API.
   - For local testing without auth wired up yet, insert one row into
     `profiles` manually with a UUID you'll reuse as `DEV_USER_ID`
     (see `frontend/src/app/upload/page.tsx` and `dashboard/page.tsx`).

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
   npm install
   npm run dev             # http://localhost:4000
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   echo "NEXT_PUBLIC_API_BASE=http://localhost:4000" > .env.local
   npm run dev             # http://localhost:3000
   ```

## What's implemented

- `POST /api/resume/upload` — parses an uploaded PDF resume and stores its text
- `POST /api/sessions` — creates a session and generates role/resume-aware questions via Claude
- `GET /api/sessions/:id` — session + its questions + any submitted answers
- `GET /api/sessions?userId=` — a user's session history (for the dashboard)
- `POST /api/answers` — submits an answer, evaluates it via Claude, stores score/feedback
- `POST /api/answers/:sessionId/complete` — finalizes a session, computes the average score

Frontend pages: landing (`/`), session setup with resume upload (`/upload`),
live interview flow with per-question scoring (`/interview/[sessionId]`), and
a history dashboard (`/dashboard`).

## Not yet wired up (next steps)

- **Auth**: pages currently use a hardcoded `DEV_USER_ID`. Swap in Supabase
  Auth (`supabase.auth.signInWith...`) and pass the real user id through.
- **Speech input**: PDF describes "real-time mock interview simulation" —
  the scaffold takes typed answers; adding voice would mean recording audio
  and either transcribing client-side or sending audio to a speech-to-text
  API before hitting `/api/answers`.
- **Vector search (Pinecone)**: the original tech list mentions Pinecone for
  retrieval — not included here since the current question-generation flow
  doesn't need a vector store yet. Add it if you want to ground questions in
  a bank of real past interview questions rather than generating from scratch.
- **Deployment**: frontend → Vercel is a natural fit (there's already a
  Vercel MCP connector available); backend → any Node host (Render, Railway,
  Fly.io) or as serverless functions if you fold it into the Next.js app.
