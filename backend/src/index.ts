import "dotenv/config";
import express from "express";
import cors from "cors";
import { resumeRouter } from "./routes/resume.js";
import { sessionsRouter } from "./routes/sessions.js";
import { answersRouter } from "./routes/answers.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost or 127.0.0.1 port (3000, 3001, etc.)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow FRONTEND_ORIGIN if specified
      if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local prototype development
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const hasPinecone = Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.trim() !== "");
  res.json({
    ok: true,
    services: {
      gemini: hasGemini ? "configured" : "missing_key",
      pinecone: hasPinecone ? "configured" : "using_local_fallback",
    },
    version: "0.2.0-gemini-pinecone",
  });
});

app.use("/api/resume", resumeRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/answers", answersRouter);

app.listen(port, () => {
  console.log(`\n=================================================`);
  console.log(`  Interview Prep API (Gemini + Pinecone Edition)  `);
  console.log(`  Listening on http://localhost:${port}           `);
  console.log(`=================================================\n`);
});
