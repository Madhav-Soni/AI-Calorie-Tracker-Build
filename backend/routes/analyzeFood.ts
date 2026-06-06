import { Router, Request, Response } from "express";
import { foodNutritionDB, dbAliases, NutritionEntry } from "../data/foodNutritionDB";

const router = Router();

const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
};

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(...args);
  }
};

// ─── Step 1 Prompt: Food Vision Detection ──────────────────────────────────────
const DETECT_PROMPT = `You are a food recognition vision AI.

Analyze the image quality first.
Is it a blurry photo, low-light image, screenshot, computer screen, or stock internet photo? If so, set "validImage" to false and write the reason.
If it is a clear photo of food, set "validImage" to true.
Then, list the identified foods and estimate your recognition confidence (from 0.0 to 1.0) for each.

Output ONLY valid JSON matching this format (no markdown, no explainers):
{
  "validImage": true,
  "reason": "Clear close-up photo of breakfast bowl",
  "foods": [
    { "name": "banana", "confidence": 0.95 },
    { "name": "egg", "confidence": 0.88 }
  ]
}

If unsure, make your best guess for the food item and estimate confidence accordingly.`;

const RETRY_PROMPT = DETECT_PROMPT;

// ─── Step 2 Nutrition Fallback Estimation (only when DB lookup fails completely) ────
const ESTIMATE_PROMPT = (food: string) => `You are a nutrition calculator. Estimate realistic nutrition values for 1 serving of the food: "${food}".
Output ONLY this JSON format:
{"name":"${food}","calories":120,"protein":3,"carbs":18,"fat":4}`;

interface MatchedFoodItem extends NutritionEntry {
  name: string;
  confidence: number;
  mappingSource: string;
}

// Normalize raw names to database keys
function normalizeFoodName(raw: string): string | null {
  const s = raw.toLowerCase().trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (foodNutritionDB[s]) return s;
  if (dbAliases[s]) return dbAliases[s];

  // Try partial mapping (e.g. "fried egg" -> "egg")
  for (const key of Object.keys(foodNutritionDB)) {
    if (s.includes(key) || key.includes(s)) {
      return key;
    }
  }

  // Singular/Plural fallback
  if (s.endsWith("s") && foodNutritionDB[s.slice(0, -1)]) {
    return s.slice(0, -1);
  }

  return null;
}

// Smart Fallback mapping for descriptive terms
function resolveDescriptiveFallback(raw: string): string | null {
  const s = raw.toLowerCase();
  
  if (s.includes("yellow fruit")) return "banana";
  if (s.includes("red fruit")) return "apple";
  if (s.includes("green vegetable") || s.includes("leafy greens")) return "spinach";
  if (s.includes("flat bread") || s.includes("indian flatbread")) return "roti";
  if (s.includes("white grain")) return "rice";
  if (s.includes("creamy liquid")) return "milk";

  return null;
}

function safeParseJSON(text: string): any {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {}

  const match = /\{[\s\S]*\}/.exec(trimmed);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

async function callCloudflare(
  imageBytes: number[] | null,
  prompt: string,
  accountId: string,
  apiToken: string
): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;

  const bodyPayload: any = { prompt, max_tokens: 512 };
  if (imageBytes) {
    bodyPayload.image = imageBytes;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (response.status === 404) {
    throw new Error("AI model unavailable. The vision model may have been updated.");
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare Workers AI Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function fetchAIEstimate(food: string, accountId: string, apiToken: string): Promise<any> {
  try {
    const res = await callCloudflare(null, ESTIMATE_PROMPT(food), accountId, apiToken);
    const parsed = safeParseJSON(res?.result?.response || "");
    if (parsed && typeof parsed.calories === "number") {
      return parsed;
    }
  } catch (e) {
    devError("AI estimation fallback failed:", e);
  }
  return null;
}

router.post("/analyze-food", async (req: Request, res: Response): Promise<void> => {
  const fallbackPayload = {
    validImage: false,
    reason: "Verification failed. Take a clearer meal photo.",
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  try {
    const { base64 } = req.body;
    if (!base64) {
      res.status(200).json(fallbackPayload);
      return;
    }

    const MAX_BASE64_BYTES = 2 * 1024 * 1024; // 2MB
    if (base64.length > MAX_BASE64_BYTES) {
      res.status(413).json({ error: "Image too large. Please use the in-app camera." });
      return;
    }

    const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
    const CF_API_TOKEN = process.env.CF_API_TOKEN;

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      res.status(200).json(fallbackPayload);
      return;
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Array.from(Buffer.from(cleanBase64, "base64"));

    devLog("[BACKEND] Calling Vision Model...");
    let result = await callCloudflare(imageBytes, DETECT_PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
    let rawResponse = result?.result?.response || "";
    devLog("[BACKEND] Raw response:", rawResponse);

    let parsed = safeParseJSON(rawResponse);
    if (!parsed || typeof parsed.validImage === "undefined") {
      devLog("[BACKEND] Malformed AI Response. Retrying...");
      result = await callCloudflare(imageBytes, RETRY_PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
      rawResponse = result?.result?.response || "";
      parsed = safeParseJSON(rawResponse);
    }

    // Default parser fallback if AI vision completely fails to format JSON
    if (!parsed) {
      devLog("[BACKEND] AI failed JSON structure. Running default parser recovery.");
      const lower = rawResponse.toLowerCase();
      
      // Basic heuristic recovery
      const detected: string[] = [];
      for (const key of Object.keys(foodNutritionDB)) {
        if (lower.includes(key)) detected.push(key);
      }
      parsed = {
        validImage: detected.length > 0,
        reason: "Heuristic parser recovery",
        foods: detected.map(name => ({ name, confidence: 0.8 }))
      };
    }

    // Check image validation block
    if (parsed.validImage === false) {
      devLog("[BACKEND] Vision model flagged image quality:", parsed.reason);
      res.status(200).json({
        validImage: false,
        reason: parsed.reason || "Take a clearer meal photo.",
        foods: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      });
      return;
    }

    const detectedFoods = Array.isArray(parsed.foods) ? parsed.foods : [];
    const matchedFoods: MatchedFoodItem[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const item of detectedFoods) {
      const name = String(item.name || "Unknown");
      const confidence = Number(item.confidence) || 0.7;

      // Stage 2: Database normalization and mapping
      let dbKey = normalizeFoodName(name);
      let mappingSource = "Local Database Mapping";

      // Descriptive fallback check
      if (!dbKey) {
        dbKey = resolveDescriptiveFallback(name);
        if (dbKey) {
          mappingSource = "Descriptive Intelligent Fallback";
        }
      }

      if (dbKey && foodNutritionDB[dbKey]) {
        const entry = foodNutritionDB[dbKey];
        matchedFoods.push({
          name: dbKey.charAt(0).toUpperCase() + dbKey.slice(1),
          portion: entry.portion,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          confidence,
          mappingSource,
        });

        totalCalories += entry.calories;
        totalProtein += entry.protein;
        totalCarbs += entry.carbs;
        totalFat += entry.fat;
      } else {
        // Fallback estimation using auxiliary call or default values
        devLog(`[BACKEND] DB Miss for "${name}". Requesting helper calculation...`);
        const estimated = await fetchAIEstimate(name, CF_ACCOUNT_ID, CF_API_TOKEN);
        
        if (estimated) {
          matchedFoods.push({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            portion: "1 serving",
            calories: Number(estimated.calories) || 120,
            protein: Number(estimated.protein) || 2,
            carbs: Number(estimated.carbs) || 15,
            fat: Number(estimated.fat) || 2,
            confidence,
            mappingSource: "Auxiliary Model Nutrition Call",
          });

          totalCalories += Number(estimated.calories) || 120;
          totalProtein += Number(estimated.protein) || 2;
          totalCarbs += Number(estimated.carbs) || 15;
          totalFat += Number(estimated.fat) || 2;
        } else {
          // Absolute hard fallback
          matchedFoods.push({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            portion: "1 serving",
            calories: 120,
            protein: 2,
            carbs: 15,
            fat: 2,
            confidence,
            mappingSource: "Absolute Hard Fallback Values",
          });

          totalCalories += 120;
          totalProtein += 2;
          totalCarbs += 15;
          totalFat += 2;
        }
      }
    }

    const payload = {
      validImage: true,
      reason: parsed.reason || "Confidence validation successful.",
      foods: matchedFoods,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      debug: {
        rawAIResponse: rawResponse,
        parsedFoods: detectedFoods,
        nutritionMappingSource: matchedFoods.map(f => `${f.name}: ${f.mappingSource}`).join(", "),
      }
    };

    res.status(200).json(payload);

  } catch (error: any) {
    devError("[BACKEND ERROR]", error);
    if (error?.message === "RATE_LIMITED") {
      res.status(429).json({
        error: "Daily AI scan limit reached. Please try again after midnight UTC.",
        retryAfter: "midnight UTC"
      });
      return;
    }
    if (error?.message && error.message.includes("AI model unavailable")) {
      res.status(503).json({
        error: "AI model unavailable. The vision model may have been updated.",
      });
      return;
    }
    res.status(200).json(fallbackPayload);
  }
});

export default router;
