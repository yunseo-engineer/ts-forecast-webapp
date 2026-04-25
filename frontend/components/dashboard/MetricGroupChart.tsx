"use client";

/**
 * MetricGroupChart
 * -----------------------------------------------------------
 * Shows one "group" (오차 / 백분율 / 상대 / 편향) as a grouped bar chart
 * across models — requirement 2.8 calls for grouping metrics by semantics
 * so the dashboard isn't just a wall of numbers.
 */

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ForecastResponse, MetricBundle } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/types";
import { MODEL_COLORS } from "./ForecastChart";

export function MetricGroupChart({
  data,
  metricKeys,
}: {
  data: ForecastResponse;
  metricKeys: (keyof MetricBundle)[];
}) {
  // rows = one row per metric, columns = model values
  const rows = metricKeys.map((k) => {
    const row: Record<string, number | string | null> = { metric: k };
    for (const r of data.results) {
      const v = r.metrics[k];
      row[r.model] = v != null && Number.isFinite(v) ? v : null;
    }
    return row;
  });

  return (
    <div className="w-full h-60">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#F0F1F4" vertical={false} />
          <XAxis
            dataKey="metric"
            tick={{ fill: "#6B6B74", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E8E8EB" }}
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
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          {data.results.map((r) => (
            <Bar
              key={r.model}
              dataKey={r.model}
              name={MODEL_LABELS[r.model]}
              fill={MODEL_COLORS[r.model]}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
