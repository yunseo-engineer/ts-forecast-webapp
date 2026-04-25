"use client";

/**
 * ForecastChart
 * -----------------------------------------------------------
 * Main visualization (requirements 2.6 + 2.9):
 *   - Actual series (train + test)
 *   - Per-model predictions (test segment + future horizon)
 *   - Clear separation: train | test | future forecast
 *
 * Designed to stay readable when several models are enabled.
 */

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { ForecastResponse, ModelKey } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { useMemo } from "react";

export const MODEL_COLORS: Record<ModelKey, string> = {
  moving_average: "#6B7280",
  ses: "#0EA5E9",
  holt: "#7C3AED",
  holt_winters: "#DC2626",
  poly_trend: "#059669",
};

interface Row {
  t: string;
  actual: number | null;
  [k: string]: number | string | null;
}

export function ForecastChart({ data }: { data: ForecastResponse }) {
  const visible = useAppStore((s) => s.visibleModels);

  const { rows, trainEnd, testEnd } = useMemo(() => buildRows(data), [data]);

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer>
        <ComposedChart
          data={rows}
          margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid stroke="#F0F1F4" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: "#6B6B74", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E8E8EB" }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#6B6B74", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E8E8EB" }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #E8E8EB",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#6B6B74" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="plainline"
          />

          {/* Shade the test segment */}
          {trainEnd && testEnd && (
            <ReferenceArea
              x1={trainEnd}
              x2={testEnd}
              fill="#111113"
              fillOpacity={0.03}
              stroke="#E8E8EB"
              strokeOpacity={0.5}
              label={{
                value: "test",
                fill: "#6B6B74",
                fontSize: 10,
                position: "insideTopLeft",
              }}
            />
          )}
          {/* Shade the future forecast segment */}
          {testEnd && (
            <ReferenceArea
              x1={testEnd}
              x2={rows[rows.length - 1]?.t}
              fill="#111113"
              fillOpacity={0.06}
              stroke="#E8E8EB"
              strokeOpacity={0.5}
              label={{
                value: "forecast",
                fill: "#6B6B74",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#0B0B0D"
            strokeWidth={1.8}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />

          {data.results.map((r) =>
            visible.has(r.model) ? (
              <Line
                key={r.model}
                type="monotone"
                dataKey={r.model}
                name={MODEL_LABELS[r.model]}
                stroke={MODEL_COLORS[r.model]}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Merge actual/train/test/per-model series into a single row array keyed by time.
function buildRows(data: ForecastResponse): {
  rows: Row[];
  trainEnd: string | undefined;
  testEnd: string | undefined;
} {
  const map = new Map<string, Row>();
  const touch = (t: string): Row => {
    let row = map.get(t);
    if (!row) {
      row = { t, actual: null };
      map.set(t, row);
    }
    return row;
  };

  data.train.forEach((p) => (touch(p.t).actual = p.y));
  data.test.forEach((p) => (touch(p.t).actual = p.y));

  for (const r of data.results) {
    r.test_pred.forEach((p) => (touch(p.t)[r.model] = p.y));
    r.forecast.forEach((p) => (touch(p.t)[r.model] = p.y));
  }

  const rows = Array.from(map.values()).sort((a, b) =>
    a.t < b.t ? -1 : a.t > b.t ? 1 : 0
  );

  const trainEnd = data.train.at(-1)?.t;
  const testEnd = data.test.at(-1)?.t ?? trainEnd;

  return { rows, trainEnd, testEnd };
}
