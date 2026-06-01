import { Router, Request, Response } from "express";

const router = Router();

const PROMPT = `You are a nutrition API. Analyze the food in this image.
Output ONLY this JSON, no text before or after:
{"foods":[{"name":"food name","portion":"serving size","calories":0,"protein":0,"carbs":0,"fat":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}
Use realistic nutrition values. Never refuse. Never explain. JSON only.`;

const RETRY_PROMPT = `Output nutrition JSON for the food in this image. JSON only, no text:
{"foods":[{"name":"food name","portion":"serving size","calories":0,"protein":0,"carbs":0,"fat":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}`;

function isRefusal(text: string): boolean {
  const phrases = [
    "i'm not able", "i cannot", "i can't", "not able to",
    "cannot analyze", "don't have the capability", "as an ai",
    "i am not able", "unable to", "can't identify",
  ];
  return phrases.some(p => text.toLowerCase().includes(p));
}

function extractJSON(text: string): any {
  // Try direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // Extract outermost { } block
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    // Try JSON parse
    try { return JSON.parse(match[0]); } catch {}
    // Try JS object eval (handles unquoted keys)
    try { return Function('"use strict"; return (' + match[0] + ')')(); } catch {}
  }

  return null;
}

async function callCloudflare(
  imageBytes: number[],
  prompt: string,
  accountId: string,
  apiToken: string
): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBytes,
      prompt,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

router.post("/analyze-food", async (req: Request, res: Response): Promise<void> => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      res.status(400).json({ error: "No image data provided" });
      return;
    }

    const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
    const CF_API_TOKEN = process.env.CF_API_TOKEN;

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      res.status(500).json({ error: "Cloudflare credentials not configured" });
      return;
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Array.from(Buffer.from(cleanBase64, "base64"));

    // First attempt
    console.log("Attempt 1...");
    let result = await callCloudflare(imageBytes, PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
    let responseText = result?.result?.response;
    console.log("Response 1:", typeof responseText === "string" ? responseText.substring(0, 100) : responseText);

    // If refusal or object, handle it
    if (typeof responseText === "object" && responseText !== null) {
      // Already a parsed object — use directly
      res.status(200).json(responseText);
      return;
    }

    if (typeof responseText === "string" && isRefusal(responseText)) {
      // Retry with simpler prompt
      console.log("Refusal detected, retrying...");
      result = await callCloudflare(imageBytes, RETRY_PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
      responseText = result?.result?.response;
      console.log("Response 2:", typeof responseText === "string" ? responseText.substring(0, 100) : responseText);
    }

    // If retry also returned an object
    if (typeof responseText === "object" && responseText !== null) {
      res.status(200).json(responseText);
      return;
    }

    // Parse the string response
    const nutrition = extractJSON(responseText);
    if (!nutrition) {
      console.error("Could not extract JSON from:", responseText);
      res.status(500).json({ error: "Could not parse nutrition data from model response" });
      return;
    }

    // Normalize fields
    const normalized = {
      foods: (nutrition.foods ?? []).map((f: any) => ({
        name: f.name ?? "Unknown",
        portion: f.portion ?? f.serving_size ?? "1 serving",
        calories: Number(f.calories ?? 0),
        protein: Number(f.protein ?? 0),
        carbs: Number(f.carbs ?? f.carbohydrates ?? 0),
        fat: Number(f.fat ?? 0),
      })),
      totalCalories: Number(nutrition.totalCalories ?? nutrition.total_calories ?? 0),
      totalProtein: Number(nutrition.totalProtein ?? nutrition.total_protein ?? 0),
      totalCarbs: Number(nutrition.totalCarbs ?? nutrition.total_carbs ?? 0),
      totalFat: Number(nutrition.totalFat ?? nutrition.total_fat ?? 0),
    };

    res.status(200).json(normalized);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to analyze food image",
    });
  }
});

export default router;
