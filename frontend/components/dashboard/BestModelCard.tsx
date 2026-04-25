"use client";

/**
 * BestModelCard
 * -----------------------------------------------------------
 * Requirement 2.10 — surface the recommended model prominently and
 * explain *why* it was chosen (based on which metric(s)).
 */

import type { ForecastResponse } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/types";
import { MODEL_COLORS } from "./ForecastChart";

export function BestModelCard({ data }: { data: ForecastResponse }) {
  const best = data.results.find((r) => r.model === data.best_model);
  if (!best) return null;

  return (
    <div className="rounded-2xl border border-ink-900 bg-ink-900 text-white p-6 shadow-soft">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: MODEL_COLORS[best.model] }}
        />
        Recommended model
      </div>

      <h2 className="mt-3 font-display text-4xl leading-none tracking-tight">
        {MODEL_LABELS[best.model]}
      </h2>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">
        {data.best_model_reason}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
        <Stat label="RMSE" value={best.metrics.RMSE} />
        <Stat label="MAPE" value={best.metrics.MAPE} suffix="%" />
        <Stat label="TS" value={best.metrics.TS} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  const text =
    value == null || !Number.isFinite(value) ? "—" : formatNum(value) + (suffix ?? "");
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div className="mt-1 text-xl tabular-nums">{text}</div>
    </div>
  );
}

function formatNum(v: number): string {
  const a = Math.abs(v);
  if (a >= 1000) return v.toFixed(0);
  if (a >= 10) return v.toFixed(2);
  if (a >= 1) return v.toFixed(3);
  return v.toFixed(4);
}
