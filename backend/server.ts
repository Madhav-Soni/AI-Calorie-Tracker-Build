import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import analyzeFood from "./routes/analyzeFood";
import { testGemini } from "./services/gemini";

const app = express();

app.use(cors());
app.use(express.json());
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

app.post("/test-gemini", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }
    const response = await testGemini(message);
    res.json({ response });
  } catch (error) {
    console.error("Gemini Test Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to connect to Gemini API",
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
