// Shared TypeScript types mirroring the backend response shape.
// Keep this file as the single source of truth between frontend and API.

export type ModelKey =
  | "moving_average"
  | "ses"
  | "holt"
  | "holt_winters"
  | "poly_trend";

export const MODEL_LABELS: Record<ModelKey, string> = {
  moving_average: "Moving Average",
  ses: "Simple Exp. Smoothing",
  holt: "Holt",
  holt_winters: "Holt-Winters",
  poly_trend: "Polynomial Trend",
};

export interface SeriesPoint {
  t: string; // ISO date string
  y: number | null;
  is_missing?: boolean;
  is_outlier?: boolean;
}

export interface ModelResult {
  model: ModelKey;
  fitted: SeriesPoint[]; // in-sample fitted values (train segment)
  test_pred: SeriesPoint[]; // predictions on held-out test segment
  forecast: SeriesPoint[]; // out-of-sample future forecast
  metrics: MetricBundle;
  notes?: string;
}

export interface MetricBundle {
  MAE: number;
  MSE: number;
  RMSE: number;
  MAPE: number | null;
  SMAPE: number;
  MASE: number | null;
  MdRAE: number | null;
  GMRAE: number | null;
  RSFE: number;
  TS: number | null;
}

export const METRIC_KEYS: (keyof MetricBundle)[] = [
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

export const METRIC_GROUPS: {
  label: string;
  keys: (keyof MetricBundle)[];
}[] = [
  { label: "오차 크기", keys: ["MAE", "MSE", "RMSE"] },
  { label: "백분율 오차", keys: ["MAPE", "SMAPE"] },
  { label: "상대 성능", keys: ["MASE", "MdRAE", "GMRAE"] },
  { label: "편향 진단", keys: ["RSFE", "TS"] },
];

export interface DatasetInfo {
  filename: string;
  rows: number;
  time_column: string;
  value_column: string;
  start: string;
  end: string;
  frequency: string | null;
  preprocessing_notes: string[];
  preview: SeriesPoint[]; // first N points
  statistics: {
    missing_count: number;
    missing_method: string;
    outlier_count: number;
    outlier_method: string;
    adf_stat: number | null;
    adf_pvalue: number | null;
    ljung_box_stat: number | null;
    ljung_box_pvalue: number | null;
  };
}

export interface ForecastResponse {
  dataset: DatasetInfo;
  horizon: number;
  train: SeriesPoint[];
  test: SeriesPoint[];
  results: ModelResult[];
  best_model: ModelKey;
  best_model_reason: string;
}
