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
}

export interface AnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
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

// ─── Config ───────────────────────────────────────────────────────────────────
// For physical device testing: replace with your machine's LAN IP (e.g. 192.168.1.42)
export const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

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
    [{ resize: { width: 512 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
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

  const raw = await response.json();
  onProgress?.("success", 100);

  // Normalise — backend may return camelCase or snake_case
  const result: AnalysisResult = {
    foods: (raw.foods ?? []).map((f: any): FoodItem => ({
      name: f.name ?? "Unknown",
      portion: f.portion ?? f.serving_size ?? "1 serving",
      calories: Number(f.calories ?? 0),
      protein: Number(f.protein ?? 0),
      carbs: Number(f.carbs ?? f.carbohydrates ?? 0),
      fat: Number(f.fat ?? 0),
    })),
    totalCalories: Number(raw.totalCalories ?? raw.total_calories ?? 0),
    totalProtein: Number(raw.totalProtein ?? raw.total_protein ?? 0),
    totalCarbs: Number(raw.totalCarbs ?? raw.total_carbs ?? 0),
    totalFat: Number(raw.totalFat ?? raw.total_fat ?? 0),
  };

  return result;
}
