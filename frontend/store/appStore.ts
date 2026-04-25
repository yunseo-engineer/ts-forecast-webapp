"use client";

import { create } from "zustand";
import { runForecast } from "@/lib/api";
import type { ForecastResponse, ModelKey } from "@/lib/types";

interface AppState {
  file: File | null;
  horizon: number;
  data: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  // Which models are visible in the comparison chart.
  visibleModels: Set<ModelKey>;

  setFile: (f: File | null) => void;
  setHorizon: (h: number) => void;
  toggleModel: (m: ModelKey) => void;
  resetAll: () => void;
  fetchForecast: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  file: null,
  horizon: 12,
  data: null,
  loading: false,
  error: null,
  visibleModels: new Set<ModelKey>([
    "moving_average",
    "ses",
    "holt",
    "holt_winters",
    "poly_trend",
  ]),

  setFile: (f) =>
    // Replacing the file invalidates cached forecast — per requirement 2.2.
    set({ file: f, data: null, error: null }),

  setHorizon: (h) =>
    // Changing horizon also invalidates the cached forecast — per requirement 2.3.
    set({ horizon: h, data: null, error: null }),

  toggleModel: (m) => {
    const next = new Set(get().visibleModels);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    set({ visibleModels: next });
  },

  resetAll: () =>
    set({
      file: null,
      horizon: 12,
      data: null,
      loading: false,
      error: null,
    }),

  fetchForecast: async () => {
    const { file, horizon } = get();
    if (!file) {
      set({ error: "먼저 CSV 파일을 업로드하세요." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await runForecast(file, horizon);
      set({ data, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      set({ error: msg, loading: false });
    }
  },
}));
