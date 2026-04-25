// Thin API client. Uses Next.js rewrite so frontend can call /api/* and
// proxy to FastAPI on :8000 during development.

import type { ForecastResponse } from "./types";

export async function runForecast(
  file: File,
  horizon: number
): Promise<ForecastResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("horizon", String(horizon));

  const res = await fetch("/api/forecast", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let msg = "Forecast request failed";
    try {
      const body = await res.json();
      msg = body?.detail ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  return (await res.json()) as ForecastResponse;
}
