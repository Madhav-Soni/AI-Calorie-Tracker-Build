import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log(
  process.env.GEMINI_API_KEY
    ? "API KEY LOADED"
    : "API KEY MISSING"
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const PROMPT = `Analyze this food image. Identify all visible foods and estimate nutritional content.
Respond ONLY with valid JSON:
{"foods":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}
- protein/carbs/fat in grams, calories in kcal
- totals must equal sum of items
- empty foods array with zero totals if no food visible`;

export async function analyzeFood(imageBase64: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const response = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    },
    PROMPT,
  ]);

  const text = response.response.text();
  return JSON.parse(text) as AnalysisResult;
}

export async function testGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  const response = await model.generateContent(prompt);
  return response.response.text();
}
