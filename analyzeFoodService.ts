import { useState, useCallback } from "react";
import { Platform } from "react-native";

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

// Physical device compatible backend URL
// For physical devices, replace '10.0.2.2' / 'localhost' with your computer's actual local IP address (e.g. '192.168.1.50')
export const API_URL = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

type AnalyzeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AnalysisResult }
  | { status: "error"; message: string };

export function useAnalyzeFood() {
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });

  const analyze = useCallback(async (imageUri: string): Promise<AnalysisResult | null> => {
    setState({ status: "loading" });
    try {
      const formData = new FormData();
      
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const response = await fetch(`${API_URL}/analyze-food`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsedErr;
        try {
          parsedErr = JSON.parse(errText);
        } catch {
          parsedErr = { error: errText };
        }
        throw new Error(parsedErr.error || `Server returned status ${response.status}`);
      }

      const data = (await response.json()) as AnalysisResult;
      setState({ status: "success", data });
      return data;
    } catch (err) {
      console.error("Food analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      setState({ status: "error", message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, analyze, reset, setState };
}
export { AnalyzeState };
