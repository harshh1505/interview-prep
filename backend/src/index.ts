import "dotenv/config";
import express from "express";
import cors from "cors";
import { resumeRouter } from "./routes/resume.js";
import { sessionsRouter } from "./routes/sessions.js";
import { answersRouter } from "./routes/answers.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/resume", resumeRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/answers", answersRouter);

app.listen(port, () => {
  console.log(`Interview prep API listening on http://localhost:${port}`);
});
