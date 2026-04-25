"use client";

/**
 * ModelSelector
 * -----------------------------------------------------------
 * Per requirement 2.6: users can toggle models on/off in the
 * comparison chart so the plot stays readable.
 */

import { useAppStore } from "@/store/appStore";
import { MODEL_LABELS, ModelKey } from "@/lib/types";
import { MODEL_COLORS } from "@/components/dashboard/ForecastChart";

export function ModelSelector() {
  const visible = useAppStore((s) => s.visibleModels);
  const toggle = useAppStore((s) => s.toggleModel);

  const keys = Object.keys(MODEL_LABELS) as ModelKey[];

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => {
        const on = visible.has(k);
        return (
          <button
            key={k}
            onClick={() => toggle(k)}
            className={
              "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-medium transition-all " +
              (on
                ? "bg-white border-ink-900 text-ink-900"
                : "bg-white border-ink-100 text-ink-500 hover:border-ink-300")
            }
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: on ? MODEL_COLORS[k] : "#D8D9DE",
              }}
            />
            {MODEL_LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}
