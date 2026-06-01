import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import analyzeFood from "./routes/analyzeFood";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
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
