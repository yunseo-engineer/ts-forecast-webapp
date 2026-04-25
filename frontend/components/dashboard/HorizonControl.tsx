"use client";

/**
 * HorizonControl
 * -----------------------------------------------------------
 * Changes the forecasting horizon (requirement 2.3).
 * Altering the value invalidates cached results via the store,
 * and the dashboard page re-fetches automatically.
 */

import { useAppStore } from "@/store/appStore";

const PRESETS = [6, 12, 24, 36];

export function HorizonControl() {
  const horizon = useAppStore((s) => s.horizon);
  const setHorizon = useAppStore((s) => s.setHorizon);
  const fetchForecast = useAppStore((s) => s.fetchForecast);

  function update(h: number) {
    if (h === horizon) return;
    setHorizon(h);
    // Run a fresh forecast immediately.
    void fetchForecast();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-500 mr-1">예측시평</span>
      <div className="inline-flex rounded-lg bg-accent-soft p-1">
        {PRESETS.map((h) => (
          <button
            key={h}
            onClick={() => update(h)}
            className={
              "h-7 px-3 text-xs rounded-md font-medium transition-colors " +
              (h === horizon
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-500 hover:text-ink-900")
            }
          >
            {h}
          </button>
        ))}
      </div>

      <label className="ml-2 inline-flex items-center gap-2">
        <span className="text-xs text-ink-500">custom</span>
        <input
          type="number"
          min={1}
          max={500}
          value={horizon}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) update(n);
          }}
          className="w-20 h-7 px-2 text-xs text-ink-900 bg-white border border-ink-100 rounded-md focus:border-ink-900 focus:outline-none"
        />
      </label>
    </div>
  );
}
