import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
}

export interface AnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  validImage?: boolean;
  reason?: string;
  debug?: {
    rawAIResponse: string;
    parsedFoods: any[];
    nutritionMappingSource: string;
  };
}

export type AnalysisStatus = "idle" | "uploading" | "analyzing" | "success" | "error";

export interface AnalysisState {
  status: AnalysisStatus;
  data: AnalysisResult | null;
  error: string | null;
  progress: number; // 0-100 for upload progress UI
}

export const INITIAL_STATE: AnalysisState = {
  status: "idle",
  data: null,
  error: null,
  progress: 0,
};

export const API_BASE =
  (process.env.EXPO_PUBLIC_API_BASE ?? "").length > 0
    ? process.env.EXPO_PUBLIC_API_BASE!
    : __DEV__
    ? "http://10.20.6.142:3000"  // local dev fallback
    : "";  // forces a visible error in prod if not configured

const ANALYZE_ENDPOINT = `${API_BASE}/analyze-food`;
const TIMEOUT_MS = 30_000;

// ─── Core fetch with timeout ──────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Check your connection.")), ms)
    ),
  ]);
}

// ─── Main service function ────────────────────────────────────────────────────
export async function analyzeFood(
  imageUri: string,
  onProgress?: (status: AnalysisStatus, progress: number) => void
): Promise<AnalysisResult> {
  onProgress?.("uploading", 10);

  // Compress the image to prevent token limit exceeded on Cloudflare
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1000 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  onProgress?.("uploading", 40);

  const response = await withTimeout(
    fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        base64: manipulated.base64,
        mimeType: "image/jpeg",
      }),
    }),
    TIMEOUT_MS
  );

  onProgress?.("analyzing", 70);

  if (!response.ok) {
    let msg = `Server error (${response.status})`;
    try {
      const body = await response.json();
      msg = body.error ?? body.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  let raw: any = null;
  try {
    raw = await response.json();
  } catch (err) {
    if (__DEV__) console.warn("[FRONTEND] Failed to parse response JSON", err);
  }

  onProgress?.("success", 100);

  // Normalise defensively — backend may return camelCase or snake_case, missing fields, or invalid arrays
  const fallback: AnalysisResult = {
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  if (!raw || typeof raw !== "object") {
    if (__DEV__) console.log("[FRONTEND RAW RESULT]", fallback);
    return fallback;
  }

  const foods: FoodItem[] = [];
  if (Array.isArray(raw.foods)) {
    for (const f of raw.foods) {
      if (f && typeof f === "object") {
        foods.push({
          name: String(f.name ?? "Unknown"),
          portion: String(f.portion ?? f.serving_size ?? "1 serving"),
          calories: Number(f.calories) || 0,
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs ?? f.carbohydrates) || 0,
          fat: Number(f.fat) || 0,
          confidence: f.confidence !== undefined ? Number(f.confidence) : undefined,
        });
      }
    }
  }

  const result: AnalysisResult = {
    foods,
    totalCalories: Number(raw.totalCalories ?? raw.total_calories) || 0,
    totalProtein: Number(raw.totalProtein ?? raw.total_protein) || 0,
    totalCarbs: Number(raw.totalCarbs ?? raw.total_carbs) || 0,
    totalFat: Number(raw.totalFat ?? raw.total_fat) || 0,
    validImage: raw.validImage !== undefined ? Boolean(raw.validImage) : undefined,
    reason: raw.reason !== undefined ? String(raw.reason) : undefined,
    debug: raw.debug !== undefined ? raw.debug : undefined,
  };

  if (__DEV__) console.log("[FRONTEND RAW RESULT]", result);
  return result;
}
