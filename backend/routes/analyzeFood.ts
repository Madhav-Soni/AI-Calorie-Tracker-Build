import { Router, Request, Response } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only"));
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT = `Analyze this food image. Identify all visible foods and estimate their nutritional content.
Respond ONLY with valid JSON, no markdown, no explanation:
{"foods":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}
Rules: protein/carbs/fat in grams, calories in kcal, totals equal sum of items, empty array with zero totals if no food visible.`;

router.post(
  "/analyze-food",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image provided" });
        return;
      }

      // Using gemini-3.5-flash which is available and verified
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const result = await model.generateContent([
        PROMPT,
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: req.file.buffer.toString("base64"),
          },
        },
      ]);

      const text = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();

      res.status(200).json(JSON.parse(text));
    } catch (error) {
      console.error("Error in analyze-food:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to analyze food image",
      });
    }
  }
);

export default router;
