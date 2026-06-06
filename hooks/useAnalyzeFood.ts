import { useState, useCallback, useRef, useEffect } from "react";
import {
  analyzeFood,
  AnalysisResult,
  AnalysisState,
  AnalysisStatus,
  INITIAL_STATE,
} from "../services/foodAnalysis";

export interface UseAnalyzeFoodReturn {
  state: AnalysisState;
  analyze: (imageUri: string) => Promise<AnalysisResult | null>;
  reset: () => void;
  /** Directly set state — used by FoodAnalysisScreen when result comes from navigation params */
  hydrate: (result: AnalysisResult) => void;
}

export function useAnalyzeFood(): UseAnalyzeFoodReturn {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  // Prevent stale state updates if component unmounts mid-request
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const set = (s: AnalysisState) => { if (mountedRef.current) setState(s); };

  const analyze = useCallback(async (imageUri: string): Promise<AnalysisResult | null> => {
    set({ status: "uploading", data: null, error: null, progress: 10 });

    try {
      const result = await analyzeFood(imageUri, (status: AnalysisStatus, progress: number) => {
        set({ status, data: null, error: null, progress });
      });

      set({ status: "success", data: result, error: null, progress: 100 });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error. Please try again.";
      set({ status: "error", data: null, error: message, progress: 0 });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    mountedRef.current = true;
    setState(INITIAL_STATE);
  }, []);

  const hydrate = useCallback((result: AnalysisResult) => {
    set({ status: "success", data: result, error: null, progress: 100 });
  }, []);

  return { state, analyze, reset, hydrate };
}
