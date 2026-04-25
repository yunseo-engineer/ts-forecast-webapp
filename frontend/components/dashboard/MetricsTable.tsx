"use client";

/**
 * MetricsTable
 * -----------------------------------------------------------
 * Full per-model × per-metric grid (requirement 2.8).
 * Highlights the best cell per metric column.
 */

import type { ForecastResponse, MetricBundle, ModelKey } from "@/lib/types";
import { MODEL_LABELS, METRIC_KEYS } from "@/lib/types";

// Metrics where smaller absolute value = better. RSFE/TS are judged by |value|.
const LOWER_IS_BETTER: (keyof MetricBundle)[] = [
  "MAE",
  "MSE",
  "RMSE",
  "MAPE",
  "SMAPE",
  "MASE",
  "MdRAE",
  "GMRAE",
  "RSFE",
  "TS",
];

export function MetricsTable({
  data,
  best,
}: {
  data: ForecastResponse;
  best: ModelKey;
}) {
  // Compute per-column winner (using |value| for bias metrics).
  const winnerByMetric = new Map<keyof MetricBundle, ModelKey>();
  for (const k of METRIC_KEYS) {
    let bestModel: ModelKey | null = null;
    let bestVal = Number.POSITIVE_INFINITY;
    for (const r of data.results) {
      const v = r.metrics[k];
      if (v == null || !Number.isFinite(v)) continue;
      const score = LOWER_IS_BETTER.includes(k) ? Math.abs(v) : -v;
      if (score < bestVal) {
        bestVal = score;
        bestModel = r.model;
      }
    }
    if (bestModel) winnerByMetric.set(k, bestModel);
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-500">
            <th className="py-2 pr-4 font-medium">Model</th>
            {METRIC_KEYS.map((k) => (
              <th key={k} className="py-2 px-3 font-medium tracking-tight">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.results.map((r) => (
            <tr key={r.model} className="border-t border-ink-100">
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900">
                    {MODEL_LABELS[r.model]}
                  </span>
                  {r.model === best && (
                    <span className="text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                      Best
                    </span>
                  )}
                </div>
              </td>
              {METRIC_KEYS.map((k) => {
                const v = r.metrics[k];
                const isWin = winnerByMetric.get(k) === r.model;
                return (
                  <td
                    key={k}
                    className={
                      "py-2.5 px-3 tabular-nums " +
                      (isWin ? "text-ink-900 font-semibold" : "text-ink-500")
                    }
                  >
                    {fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1000) return v.toFixed(0);
  if (a >= 10) return v.toFixed(2);
  if (a >= 1) return v.toFixed(3);
  return v.toFixed(4);
}
