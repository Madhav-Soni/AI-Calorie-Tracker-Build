import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import analyzeFood from "./routes/analyzeFood";

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? false // mobile apps don't send Origin headers — block all browser/curl requests
    : "*",
  methods: ["POST", "GET"],
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  max: 10,                   // max 10 AI scans per IP per minute
  message: { error: "Too many requests. Please wait before scanning again." },
});

app.use(express.json({ limit: "10mb" }));
app.use("/analyze-food", limiter);
app.use(analyzeFood);

app.get("/", (_req, res) => {
  res.json({
    status: "running",
    message: "AI Calorie Tracker Backend"
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Server running on port 3000"));
