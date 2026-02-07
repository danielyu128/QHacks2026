import express from "express";
import cors from "cors";
import { coachRouter } from "./routes/coach.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", coachRouter);

// Start
app.listen(PORT, () => {
  console.log(`🚀 Bias Detector Backend running on http://localhost:${PORT}`);
  console.log(`   POST /api/coach — Coaching endpoint`);
  console.log(`   GET /health — Health check`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn(`⚠️  GEMINI_API_KEY not set — will use fallback coaching`);
  }
});
