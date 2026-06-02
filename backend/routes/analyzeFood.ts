import { Router, Request, Response } from "express";

const router = Router();

// ─── Prompt: ONLY food identification ────────────────────────────────────────
const PROMPT = `Identify every food item visible in this image.

Return STRICT JSON only — no markdown, no backticks, no explanation, no nutrition values.

Format:
{"foods":["food1","food2"]}

Rules:
- Only food names, nothing else
- Use common English names
- If no food is visible return {"foods":[]}`;

const RETRY_PROMPT = `Output food names JSON for the food in this image. JSON only, no text:
{"foods": ["food name"]}`;

const ESTIMATE_PROMPT = (food: string) => `You are a nutrition API. Estimate realistic nutrition values for 1 serving of the food item: "${food}".
Output ONLY this JSON format, no commentary, no markdown, no other text:
{"name":"${food}","calories":0,"protein":0,"carbs":0,"fat":0}`;

const ESTIMATE_RETRY_PROMPT = (food: string) => `Return nutrition JSON only for "${food}". JSON: {"name":"${food}","calories":100,"protein":2,"carbs":15,"fat":2}`;

interface FoodEntry {
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── FOOD DATABASE ────────────────────────────────────────────────────────────
const FOOD_DB: Record<string, FoodEntry> = {
  // ── Fruits ──
  apple:          { portion: "1 medium (182g)",   calories: 95,  protein: 0.5, carbs: 25,  fat: 0.3 },
  banana:         { portion: "1 medium (118g)",   calories: 105, protein: 1.3, carbs: 27,  fat: 0.3 },
  mango:          { portion: "1 cup sliced (165g)",calories: 99, protein: 1.4, carbs: 25,  fat: 0.6 },
  orange:         { portion: "1 medium (131g)",   calories: 62,  protein: 1.2, carbs: 15,  fat: 0.2 },
  grapes:         { portion: "1 cup (92g)",        calories: 62,  protein: 0.6, carbs: 16,  fat: 0.3 },
  strawberry:     { portion: "1 cup (152g)",       calories: 49,  protein: 1.0, carbs: 12,  fat: 0.5 },
  watermelon:     { portion: "2 cups (280g)",      calories: 84,  protein: 1.7, carbs: 21,  fat: 0.4 },
  pineapple:      { portion: "1 cup chunks (165g)",calories: 82, protein: 0.9, carbs: 22,  fat: 0.2 },
  avocado:        { portion: "1/2 medium (68g)",   calories: 114, protein: 1.3, carbs: 6,   fat: 10  },
  blueberry:      { portion: "1 cup (148g)",       calories: 84,  protein: 1.1, carbs: 21,  fat: 0.5 },

  // ── Vegetables ──
  broccoli:       { portion: "1 cup (91g)",        calories: 31,  protein: 2.6, carbs: 6,   fat: 0.3 },
  spinach:        { portion: "1 cup (30g)",        calories: 7,   protein: 0.9, carbs: 1,   fat: 0.1 },
  carrot:         { portion: "1 medium (61g)",     calories: 25,  protein: 0.6, carbs: 6,   fat: 0.1 },
  tomato:         { portion: "1 medium (123g)",    calories: 22,  protein: 1.1, carbs: 5,   fat: 0.2 },
  cucumber:       { portion: "1 cup sliced (119g)",calories: 16,  protein: 0.7, carbs: 4,   fat: 0.1 },
  corn:           { portion: "1 ear (90g)",        calories: 77,  protein: 2.9, carbs: 17,  fat: 1.1 },
  potato:         { portion: "1 medium (150g)",    calories: 130, protein: 3.0, carbs: 30,  fat: 0.1 },
  "sweet potato": { portion: "1 medium (130g)",   calories: 112, protein: 2.0, carbs: 26,  fat: 0.1 },
  onion:          { portion: "1 medium (110g)",    calories: 44,  protein: 1.2, carbs: 10,  fat: 0.1 },
  lettuce:        { portion: "1 cup (47g)",        calories: 8,   protein: 0.6, carbs: 1,   fat: 0.1 },

  // ── Grains & Bread ──
  rice:           { portion: "1 cup cooked (186g)",calories: 242, protein: 4.4, carbs: 53,  fat: 0.4 },
  "brown rice":   { portion: "1 cup cooked (195g)",calories: 216, protein: 5.0, carbs: 45,  fat: 1.8 },
  pasta:          { portion: "1 cup cooked (140g)",calories: 220, protein: 8.0, carbs: 43,  fat: 1.3 },
  bread:          { portion: "1 slice (30g)",      calories: 79,  protein: 2.7, carbs: 15,  fat: 1.0 },
  "white bread":  { portion: "1 slice (30g)",      calories: 79,  protein: 2.7, carbs: 15,  fat: 1.0 },
  "whole wheat bread":{ portion: "1 slice (30g)", calories: 69,  protein: 3.6, carbs: 12,  fat: 1.1 },
  oats:           { portion: "1 cup cooked (234g)",calories: 154, protein: 6.0, carbs: 28,  fat: 2.6 },
  oatmeal:        { portion: "1 cup cooked (234g)",calories: 154, protein: 6.0, carbs: 28,  fat: 2.6 },
  cereal:         { portion: "1 cup (30g)",        calories: 110, protein: 2.0, carbs: 24,  fat: 0.5 },
  noodles:        { portion: "1 cup cooked (160g)",calories: 220, protein: 7.0, carbs: 40,  fat: 2.0 },
  tortilla:       { portion: "1 medium (45g)",     calories: 146, protein: 3.8, carbs: 25,  fat: 3.5 },

  // ── Proteins ──
  chicken:        { portion: "100g grilled",       calories: 165, protein: 31,  carbs: 0,   fat: 3.6 },
  "chicken breast":{ portion: "100g grilled",     calories: 165, protein: 31,  carbs: 0,   fat: 3.6 },
  beef:           { portion: "100g cooked",        calories: 250, protein: 26,  carbs: 0,   fat: 15  },
  salmon:         { portion: "100g cooked",        calories: 208, protein: 20,  carbs: 0,   fat: 13  },
  tuna:           { portion: "100g canned",        calories: 116, protein: 26,  carbs: 0,   fat: 1.0 },
  egg:            { portion: "1 large (50g)",      calories: 72,  protein: 6.3, carbs: 0.4, fat: 5.0 },
  eggs:           { portion: "2 large (100g)",     calories: 144, protein: 12.6,carbs: 0.8, fat: 10  },
  shrimp:         { portion: "100g cooked",        calories: 99,  protein: 24,  carbs: 0,   fat: 0.3 },
  pork:           { portion: "100g cooked",        calories: 242, protein: 27,  carbs: 0,   fat: 14  },
  lamb:           { portion: "100g cooked",        calories: 258, protein: 25,  carbs: 0,   fat: 17  },
  tofu:           { portion: "100g firm",          calories: 76,  protein: 8.0, carbs: 2.0, fat: 4.0 },

  // ── Dairy ──
  milk:           { portion: "1 cup (244ml)",      calories: 149, protein: 8.0, carbs: 12,  fat: 8.0 },
  cheese:         { portion: "1 slice (28g)",      calories: 113, protein: 7.0, carbs: 0.4, fat: 9.3 },
  yogurt:         { portion: "1 cup (245g)",       calories: 149, protein: 8.5, carbs: 11,  fat: 8.0 },
  "greek yogurt": { portion: "1 cup (245g)",       calories: 130, protein: 17,  carbs: 9,   fat: 4.0 },
  butter:         { portion: "1 tbsp (14g)",       calories: 102, protein: 0.1, carbs: 0,   fat: 11.5},
  "ice cream":    { portion: "1/2 cup (66g)",      calories: 137, protein: 2.3, carbs: 16,  fat: 7.3 },

  // ── Fast Food & Meals ──
  pizza:          { portion: "1 slice (107g)",     calories: 285, protein: 12,  carbs: 36,  fat: 10  },
  burger:         { portion: "1 regular (150g)",   calories: 354, protein: 20,  carbs: 29,  fat: 17  },
  hamburger:      { portion: "1 regular (150g)",   calories: 354, protein: 20,  carbs: 29,  fat: 17  },
  sandwich:       { portion: "1 medium (200g)",    calories: 350, protein: 18,  carbs: 40,  fat: 12  },
  hotdog:         { portion: "1 regular (98g)",    calories: 242, protein: 10,  carbs: 18,  fat: 15  },
  fries:          { portion: "medium (117g)",      calories: 365, protein: 3.4, carbs: 48,  fat: 17  },
  "french fries": { portion: "medium (117g)",      calories: 365, protein: 3.4, carbs: 48,  fat: 17  },
  taco:           { portion: "1 regular (170g)",   calories: 210, protein: 12,  carbs: 21,  fat: 9.0 },
  burrito:        { portion: "1 regular (300g)",   calories: 490, protein: 22,  carbs: 65,  fat: 15  },
  sushi:          { portion: "6 pieces (200g)",    calories: 350, protein: 14,  carbs: 60,  fat: 4.0 },
  "fried rice":   { portion: "1 cup (198g)",       calories: 238, protein: 5.0, carbs: 42,  fat: 5.0 },
  "stir fry":     { portion: "1 cup (200g)",       calories: 180, protein: 12,  carbs: 18,  fat: 6.0 },
  curry:          { portion: "1 cup (250g)",       calories: 300, protein: 15,  carbs: 30,  fat: 12  },
  soup:           { portion: "1 bowl (240ml)",     calories: 100, protein: 5.0, carbs: 12,  fat: 3.0 },
  salad:          { portion: "1 bowl (200g)",      calories: 150, protein: 4.0, carbs: 12,  fat: 9.0 },

  // ── Snacks ──
  chips:          { portion: "1 oz (28g)",         calories: 149, protein: 2.0, carbs: 15,  fat: 9.5 },
  cookie:         { portion: "2 medium (30g)",     calories: 148, protein: 1.5, carbs: 21,  fat: 7.0 },
  chocolate:      { portion: "1 oz (28g)",         calories: 155, protein: 2.2, carbs: 17,  fat: 9.0 },
  cake:           { portion: "1 slice (90g)",      calories: 350, protein: 4.0, carbs: 52,  fat: 14  },
  donut:          { portion: "1 medium (60g)",     calories: 253, protein: 3.4, carbs: 31,  fat: 14  },
  popcorn:        { portion: "3 cups (24g)",       calories: 93,  protein: 3.0, carbs: 18,  fat: 1.1 },
  nuts:           { portion: "1 oz (28g)",         calories: 172, protein: 5.0, carbs: 6.0, fat: 15  },
  "peanut butter":{ portion: "2 tbsp (32g)",      calories: 191, protein: 7.0, carbs: 7.0, fat: 16  },

  // ── Drinks ──
  coffee:         { portion: "1 cup (240ml)",      calories: 5,   protein: 0.3, carbs: 0,   fat: 0.1 },
  juice:          { portion: "1 cup (240ml)",      calories: 112, protein: 0.5, carbs: 26,  fat: 0.3 },
  soda:           { portion: "1 can (355ml)",      calories: 140, protein: 0,   carbs: 39,  fat: 0   },
  beer:           { portion: "1 can (355ml)",      calories: 153, protein: 1.6, carbs: 13,  fat: 0   },
  smoothie:       { portion: "1 cup (240ml)",      calories: 150, protein: 3.0, carbs: 30,  fat: 2.0 },

  // ── Indian Food ──
  roti:           { portion: "1 piece (30g)",      calories: 104, protein: 3.0, carbs: 18,  fat: 3.0 },
  naan:           { portion: "1 piece (90g)",      calories: 262, protein: 8.7, carbs: 45,  fat: 5.1 },
  dal:            { portion: "1 cup (240g)",       calories: 230, protein: 15,  carbs: 38,  fat: 2.0 },
  biryani:        { portion: "1 cup (200g)",       calories: 290, protein: 12,  carbs: 45,  fat: 8.0 },
  samosa:         { portion: "1 piece (60g)",      calories: 154, protein: 3.0, carbs: 18,  fat: 8.0 },
  idli:           { portion: "2 pieces (80g)",     calories: 80,  protein: 3.0, carbs: 16,  fat: 0.5 },
  dosa:           { portion: "1 medium (90g)",     calories: 170, protein: 4.0, carbs: 30,  fat: 4.5 },
  paneer:         { portion: "100g",               calories: 265, protein: 18,  carbs: 3.4, fat: 20  },
  "palak paneer": { portion: "1 cup (240g)",       calories: 280, protein: 14,  carbs: 10,  fat: 20  },
  "butter chicken":{ portion: "1 cup (240g)",     calories: 320, protein: 22,  carbs: 12,  fat: 20  },
  chapati:        { portion: "1 piece (30g)",      calories: 104, protein: 3.0, carbs: 18,  fat: 3.0 },
  "chana masala": { portion: "1 cup (240g)",       calories: 269, protein: 14,  carbs: 45,  fat: 5.0 },
  upma:           { portion: "1 cup (200g)",       calories: 200, protein: 5.0, carbs: 32,  fat: 6.0 },
  poha:           { portion: "1 cup (180g)",       calories: 180, protein: 3.0, carbs: 35,  fat: 4.0 },
};

// ─── Aliases — common alternate names → canonical DB key ─────────────────────
const ALIASES: Record<string, string> = {
  "fried chicken": "chicken",
  "grilled chicken": "chicken",
  "chicken curry": "chicken",
  "roast chicken": "chicken",
  "boiled egg": "egg",
  "scrambled egg": "eggs",
  "fried egg": "egg",
  "hard boiled egg": "egg",
  "white rice": "rice",
  "steamed rice": "rice",
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "spaghetti": "pasta",
  "penne": "pasta",
  "macaroni": "pasta",
  "fettuccine": "pasta",
  "whole grain bread": "whole wheat bread",
  "toast": "bread",
  "cheddar": "cheese",
  "mozzarella": "cheese",
  "parmesan": "cheese",
  "coke": "soda",
  "pepsi": "soda",
  "cola": "soda",
  "french fries": "fries",
  "potato chips": "chips",
  "tortilla chips": "chips",
  "mixed nuts": "nuts",
  "almonds": "nuts",
  "cashews": "nuts",
  "walnuts": "nuts",
  "cheeseburger": "burger",
  "veggie burger": "burger",
  "sub": "sandwich",
  "wrap": "sandwich",
  "flatbread": "tortilla",
  "chapatti": "chapati",
  "roti chapati": "roti",
  "lentils": "dal",
  "lentil soup": "dal",
  "cottage cheese": "paneer",
};

// ─── Normalize a raw AI food string to a DB key ───────────────────────────────
function normalize(raw: string): string | null {
  const s = raw.toLowerCase().trim()
    .replace(/[^a-z\s]/g, "")   // strip punctuation/numbers
    .replace(/\s+/g, " ")
    .trim();

  if (FOOD_DB[s])    return s;
  if (ALIASES[s])    return ALIASES[s];

  // Partial match — e.g. "grilled salmon fillet" → "salmon"
  for (const key of Object.keys(FOOD_DB)) {
    if (s.includes(key) || key.includes(s)) return key;
  }

  return null; // not found
}

function isRefusal(text: string): boolean {
  const phrases = [
    "i'm not able", "i cannot", "i can't", "not able to",
    "cannot analyze", "don't have the capability", "as an ai",
    "i am not able", "unable to", "can't identify",
  ];
  return phrases.some(p => text.toLowerCase().includes(p));
}

function safeParseAIResponse(raw: unknown): any {
  if (typeof raw === "object" && raw !== null) {
    return raw;
  }

  const str = typeof raw === "string" ? raw : String(raw ?? "");
  const trimmed = str.trim();

  // Try direct parse
  try { return JSON.parse(trimmed); } catch {}

  // Extract outermost { } block
  const match = /\{[\s\S]*\}/.exec(trimmed);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    try { return Function('"use strict"; return (' + match[0] + ')')(); } catch {}
  }

  // Extract array block fallback
  const arrayMatch = /\[[\s\S]*\]/.exec(trimmed);
  if (arrayMatch) {
    try {
      const parsedArray = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsedArray)) {
        return { foods: parsedArray };
      }
    } catch {}
    try {
      const parsedArray = Function('"use strict"; return (' + arrayMatch[0] + ')')();
      if (Array.isArray(parsedArray)) {
        return { foods: parsedArray };
      }
    } catch {}
  }

  return {
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  };
}

function isValidEstimation(parsed: any): boolean {
  return (
    parsed &&
    typeof parsed === "object" &&
    typeof parsed.calories === "number" && parsed.calories >= 0 &&
    typeof parsed.protein === "number" && parsed.protein >= 0 &&
    typeof parsed.carbs === "number" && parsed.carbs >= 0 &&
    typeof parsed.fat === "number" && parsed.fat >= 0
  );
}

async function callCloudflare(
  imageBytes: number[] | null,
  prompt: string,
  accountId: string,
  apiToken: string
): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;

  const bodyPayload: any = {
    prompt,
    max_tokens: 512,
  };
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function estimateNutrition(
  food: string,
  accountId: string,
  apiToken: string
): Promise<any> {
  const prompt = ESTIMATE_PROMPT(food);
  console.log(`Estimating nutrition for unknown food "${food}"...`);

  try {
    let result = await callCloudflare(null, prompt, accountId, apiToken);
    let responseText = result?.result?.response;

    let parsed = safeParseAIResponse(responseText);

    // Validate response using the validator
    if (isValidEstimation(parsed)) {
      return parsed;
    }

    // Retry once if invalid or malformed
    console.log(`Estimation invalid or malformed for "${food}", retrying once...`);
    const retryPrompt = ESTIMATE_RETRY_PROMPT(food);
    result = await callCloudflare(null, retryPrompt, accountId, apiToken);
    responseText = result?.result?.response;
    parsed = safeParseAIResponse(responseText);

    if (isValidEstimation(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error(`Error estimating nutrition for "${food}":`, err);
  }

  return null;
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

    // First attempt to identify foods
    console.log("Attempt 1...");
    let result = await callCloudflare(imageBytes, PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
    let responseText = result?.result?.response;
    console.log("Response 1:", typeof responseText === "string" ? responseText.substring(0, 100) : responseText);

    if (typeof responseText === "string" && isRefusal(responseText)) {
      // Retry with simpler prompt
      console.log("Refusal detected, retrying...");
      result = await callCloudflare(imageBytes, RETRY_PROMPT, CF_ACCOUNT_ID, CF_API_TOKEN);
      responseText = result?.result?.response;
      console.log("Response 2:", typeof responseText === "string" ? responseText.substring(0, 100) : responseText);
    }

    const parsed = safeParseAIResponse(responseText);
    let rawNames: string[] = [];
    if (parsed && Array.isArray(parsed.foods)) {
      rawNames = parsed.foods.map(String);
    } else if (Array.isArray(parsed)) {
      rawNames = parsed.map(String);
    }

    if (!rawNames || rawNames.length === 0) {
      res.status(422).json({ error: "No food confidently detected. Try a clearer photo." });
      return;
    }

    console.log("Identified:", rawNames);

    const matchedFoods: any[] = [];
    const unrecognized: string[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const name of rawNames) {
      const key = normalize(name);
      if (key && FOOD_DB[key]) {
        console.log(`Using deterministic DB entry for known food "${name}" -> key: "${key}"`);
        const entry = FOOD_DB[key];
        matchedFoods.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          portion: entry.portion,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
        });
        totalCalories += entry.calories;
        totalProtein += entry.protein;
        totalCarbs += entry.carbs;
        totalFat += entry.fat;
      } else {
        // Fallback to AI estimation for unknown food
        console.log(`Unknown food "${name}", calling fallback estimation...`);
        const estimated = await estimateNutrition(name, CF_ACCOUNT_ID, CF_API_TOKEN);
        if (estimated) {
          console.log(`Successfully estimated nutrition for unknown food "${name}"`);
          const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
          matchedFoods.push({
            name: capitalizedName,
            portion: estimated.portion ?? "1 serving",
            calories: Number(estimated.calories ?? 0),
            protein: Number(estimated.protein ?? 0),
            carbs: Number(estimated.carbs ?? 0),
            fat: Number(estimated.fat ?? 0)
          });
          totalCalories += Number(estimated.calories ?? 0);
          totalProtein += Number(estimated.protein ?? 0);
          totalCarbs += Number(estimated.carbs ?? 0);
          totalFat += Number(estimated.fat ?? 0);
        } else {
          unrecognized.push(name);
          console.log("Not in DB and estimation failed:", name);
        }
      }
    }

    // Step 3: Backend computes totals deterministically
    const responsePayload = {
      foods: matchedFoods,
      totalCalories: Number(totalCalories.toFixed(1)),
      totalProtein: Number(totalProtein.toFixed(1)),
      totalCarbs: Number(totalCarbs.toFixed(1)),
      totalFat: Number(totalFat.toFixed(1)),
      unrecognized,
    };

    // Validation: Any recognized food must yield > 0 calories
    if (responsePayload.totalCalories <= 0) {
      res.status(400).json({ error: "Food is not clearly visible. Please retake the photo." });
      return;
    }

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to analyze food image",
    });
  }
});

export default router;
