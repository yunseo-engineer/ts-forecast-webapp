"use client";

/**
 * BiasCard
 * -----------------------------------------------------------
 * Requirement 2.8: RSFE/TS measure forecast bias, not error size.
 * Show them separately so they're not misread alongside MAE/RMSE.
 *
 * Green region = acceptable tracking-signal band (|TS| ≤ 4).
 */

import type { ForecastResponse } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/types";
import { MODEL_COLORS } from "./ForecastChart";

const TS_LIMIT = 4;

export function BiasCard({ data }: { data: ForecastResponse }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        RSFE(누적 예측오차)와 TS(Tracking Signal)는 오차 크기가 아니라{" "}
        <strong className="text-ink-700">예측 편향</strong>을 진단합니다.
        TS가 ±{TS_LIMIT}을 벗어나면 편향이 유의미하다고 판단합니다.
      </p>

      <div className="space-y-3">
        {data.results.map((r) => {
          const ts = r.metrics.TS;
          const rsfe = r.metrics.RSFE;
          const tsClamped =
            ts == null ? 0 : Math.max(Math.min(ts, TS_LIMIT * 2), -TS_LIMIT * 2);
          // Normalize TS to 0..100 for the bar (TS_LIMIT*2 maps to edges)
          const pct = ((tsClamped + TS_LIMIT * 2) / (TS_LIMIT * 4)) * 100;
          const within = ts != null && Math.abs(ts) <= TS_LIMIT;

          return (
            <div key={r.model}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-2 text-ink-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: MODEL_COLORS[r.model] }}
                  />
                  {MODEL_LABELS[r.model]}
                </span>
                <span className="tabular-nums text-ink-500">
                  RSFE {fmt(rsfe)} · TS{" "}
                  <span
                    className={
                      within ? "text-emerald-700" : "text-red-600 font-semibold"
                    }
                  >
                    {fmt(ts)}
                  </span>
                </span>
              </div>

              <div className="relative h-2 rounded-full bg-accent-soft overflow-hidden">
                {/* acceptable zone */}
                <div
                  className="absolute inset-y-0 bg-emerald-100"
                  style={{ left: "37.5%", width: "25%" }}
                />
                {/* center line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink-300" />
                {/* marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white"
                  style={{
                    left: `calc(${pct}% - 5px)`,
                    background: MODEL_COLORS[r.model],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 10) return v.toFixed(2);
  if (a >= 1) return v.toFixed(3);
  return v.toFixed(4);
}
