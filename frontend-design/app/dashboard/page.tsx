"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import {
  MODEL_LABELS,
  type ForecastResponse,
  type MetricBundle,
  type ModelKey,
  type ModelResult,
  type SeriesPoint,
} from "@/lib/types";
import { acf, decomposeAdditive, inferPeriod, pacf } from "@/lib/timeseries";

/**
 * /dashboard — design from `forecastlab/dashboard.html`, wired to the
 * real backend response stored in Zustand.
 *
 *   Forecast chart        : actual = train ∪ test, forecast = best model,
 *                           band  = min/max across all 5 models per step
 *   ACF / PACF            : computed client-side from train (timeseries.ts)
 *   Decomposition         : additive, period inferred from frequency
 *   Model performance     : real `results[]`, sorted by RMSE asc
 *   Metric tiles          : 8 of the backend's 10 metrics for best model
 *   Verdict               : `best_model_reason`
 *
 * If no analysis has been run yet, redirect to /upload.
 */
export default function DashboardPage() {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);

  const blobRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const forecastRef = useRef<SVGSVGElement>(null);
  const acfRef = useRef<SVGSVGElement>(null);
  const pacfRef = useRef<SVGSVGElement>(null);
  const decompRef = useRef<SVGSVGElement>(null);

  // Body class hookup
  useEffect(() => {
    document.body.classList.add("loaded", "page-dashboard");
    return () => {
      document.body.classList.remove("page-dashboard");
    };
  }, []);

  // Cursor blob + nav scroll
  useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let bx = mx, by = my;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const loop = () => {
      bx += (mx - bx) * 0.08;
      by += (my - by) * 0.08;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const onScroll = () => {
      if (navRef.current) navRef.current.classList.toggle("scrolled", window.scrollY > 30);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Redirect to /upload if no analysis present.
  useEffect(() => {
    if (!data) router.replace("/upload");
  }, [data, router]);

  const trainValues = useMemo<number[]>(() => {
    if (!data) return [];
    return data.train.filter((p) => p.y !== null).map((p) => p.y as number);
  }, [data]);

  // Render charts whenever data changes.
  useEffect(() => {
    if (!data) return;
    drawForecast(forecastRef.current, data, setTooltip);
    const trainTs = data.train.filter((p) => p.y !== null).map((p) => new Date(p.t).getTime());
    drawDecomp(decompRef.current, trainValues, data.dataset.frequency ?? null, trainTs);
    drawAcfChart(acfRef.current, trainValues, "acf");
    drawAcfChart(pacfRef.current, trainValues, "pacf");
  }, [data, trainValues]);

  if (!data) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "140px 36px", color: "var(--ink-dim)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.32em", color: "var(--ink-faint)" }}>
          NO ANALYSIS
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", margin: "12px 0" }}>
          분석 결과가 없습니다.
        </h1>
        <p>업로드 페이지로 이동합니다…</p>
      </main>
    );
  }

  const bestResult = data.results.find((r) => r.model === data.best_model) ?? data.results[0];
  const sortedResults = [...data.results].sort((a, b) => a.metrics.RMSE - b.metrics.RMSE);
  const bestRmseAsc = sortedResults[0]?.metrics.RMSE ?? 1;
  const worstRmseAsc = sortedResults[sortedResults.length - 1]?.metrics.RMSE ?? bestRmseAsc;

  // Score bar — lower RMSE is better, so map best→100%, worst→40%.
  const scoreOf = (rmse: number) => {
    if (worstRmseAsc === bestRmseAsc) return 100;
    const norm = 1 - (rmse - bestRmseAsc) / (worstRmseAsc - bestRmseAsc);
    return Math.max(40, Math.min(100, 40 + norm * 60));
  };

  const startStr = data.dataset.start.slice(0, 10);
  const endStr = data.dataset.end.slice(0, 10);
  const noteCount = data.dataset.preprocessing_notes.length;
  const bestLabel = MODEL_LABELS[data.best_model];
  const stats = data.dataset.statistics || {
    missing_count: 0, missing_method: '', outlier_count: 0, outlier_method: '',
    adf_pvalue: null, ljung_box_pvalue: null
  };

  return (
    <>
      <div className="cursor-blob" ref={blobRef} />

      <nav className="nav" ref={navRef}>
        <a href="/" className="brand">
          <span className="brand-mark" />
          ForecastLab
        </a>
        <div className="nav-links">
          <a href="/">홈</a>
          <a href="/upload">새 분석</a>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="head">
          <div>
            <div className="sub">
              REPORT · {data.dataset.filename} · MODEL: {bestLabel.toUpperCase()}
            </div>
            <h1>
              분석 결과 <span className="grad-text">대시보드</span>
            </h1>
          </div>
          <div className="head-actions">
            <button className="btn btn-ghost" onClick={() => downloadForecastCsv(data)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              CSV
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              리포트 PDF
            </button>
          </div>
        </div>

        <div className="badges">
          <div className="badge">
            <span className="b-status b-grad" />
            <div className="b-label">Series</div>
            <div className="b-value">{data.dataset.rows.toLocaleString()} rows</div>
            <div className="b-detail">freq · {data.dataset.frequency ?? "auto"}</div>
          </div>
          <div className="badge">
            <span className="b-status b-grad" />
            <div className="b-label">Range</div>
            <div className="b-value" style={{ whiteSpace: "nowrap", fontSize: "14px", letterSpacing: "-0.02em" }}>
              {startStr} <span style={{ color: "var(--ink-faint)" }}>→</span> {endStr}
            </div>
            <div className="b-detail">
              time · {data.dataset.time_column} · value · {data.dataset.value_column}
            </div>
          </div>
          <div className="badge">
            <span className={`b-status ${(stats.missing_count > 0 || stats.outlier_count > 0) ? "b-warn" : "b-ok"}`} />
            <div className="b-label">Data Quality</div>
            <div className="b-value" style={{ fontSize: "13px" }}>
              Missing: {stats.missing_count} | Outliers: {stats.outlier_count}
            </div>
            <div className="b-detail" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`${stats.missing_method} / ${stats.outlier_method}`}>
              {stats.missing_method} / {stats.outlier_method}
            </div>
          </div>
          <div className="badge">
            <span className="b-status b-grad" />
            <div className="b-label">Best Model</div>
            <div className="b-value">{bestLabel}</div>
            <div className="b-detail">
              RMSE {fmtNum(bestResult.metrics.RMSE)} · MAPE {fmtPct(bestResult.metrics.MAPE)}
            </div>
          </div>
        </div>

        <div className="chart-grid">
          <div className="panel chart">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">CHART · 01</div>
                <h2>Forecast — 시계열 + 신뢰구간</h2>
              </div>
              <div className="legend">
                <span className="lg">
                  <span className="dot" style={{ background: "#a4a8d0" }} />
                  ACTUAL
                </span>
                <span className="lg">
                  <span className="dot" style={{ background: "#10b981" }} />
                  FORECAST
                </span>
                <span className="lg">
                  <span className="dot" style={{ background: "rgba(16,185,129,0.3)" }} />
                  CI 80
                </span>
                <span className="lg">
                  <span className="dot" style={{ background: "rgba(16,185,129,0.15)" }} />
                  CI 95
                </span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <svg ref={forecastRef} viewBox="0 0 900 360" style={{ display: "block", width: "100%", height: "auto" }} />
              {tooltip && (
                <div
                  style={{
                    position: "absolute",
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: "translate(-50%, -110%)",
                    pointerEvents: "none",
                    background: "rgba(10, 12, 35, 0.95)",
                    border: "1px solid var(--line-strong)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    lineHeight: 1.6,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    zIndex: 10,
                    whiteSpace: "nowrap"
                  }}
                  dangerouslySetInnerHTML={{ __html: tooltip.html }}
                />
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">CHART · 03</div>
                <h2>ACF / PACF & Tests</h2>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                <div>ADF p-value: {stats.adf_pvalue !== null ? stats.adf_pvalue.toFixed(4) : "—"}</div>
                <div>Ljung-Box p-value: {stats.ljung_box_pvalue !== null ? stats.ljung_box_pvalue.toFixed(4) : "—"}</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.18em", marginBottom: 6 }}>
              ACF
            </div>
            <svg ref={acfRef} viewBox="0 0 360 130" />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.18em", margin: "16px 0 6px" }}>
              PACF
            </div>
            <svg ref={pacfRef} viewBox="0 0 360 130" />
          </div>
        </div>

        <div className="chart-grid full">
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">CHART · 02</div>
                <h2>Decomposition — Trend / Seasonal / Residual</h2>
              </div>
              <div className="panel-eyebrow">period · {inferPeriod(data.dataset.frequency, trainValues.length)}</div>
            </div>
            <svg ref={decompRef} viewBox="0 0 1200 360" />
          </div>
        </div>

        <div className="chart-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">CHART · 04</div>
                <h2>Model Performance</h2>
              </div>
            </div>
            <table className="models">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>MAPE</th>
                  <th>RMSE</th>
                  <th>MAE</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r) => (
                  <tr key={r.model} className={r.model === data.best_model ? "best" : ""}>
                    <td className="model">{MODEL_LABELS[r.model]}</td>
                    <td className="metric">{fmtPct(r.metrics.MAPE)}</td>
                    <td className="metric">{fmtNum(r.metrics.RMSE)}</td>
                    <td className="metric">{fmtNum(r.metrics.MAE)}</td>
                    <td>
                      <div className="bar-bg">
                        <div className="bar-fg" style={{ width: `${scoreOf(r.metrics.RMSE)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-eyebrow">CHART · 05</div>
                <h2>Evaluation Metrics · {bestLabel}</h2>
              </div>
            </div>
            <div className="metric-tiles">
              <MetricTile label="MAPE" value={fmtPct(bestResult.metrics.MAPE)} accent />
              <MetricTile label="RMSE" value={fmtNum(bestResult.metrics.RMSE)} />
              <MetricTile label="MAE" value={fmtNum(bestResult.metrics.MAE)} />
              <MetricTile label="SMAPE" value={fmtPct(bestResult.metrics.SMAPE)} />
              <MetricTile label="MASE" value={fmtNum(bestResult.metrics.MASE)} />
              <MetricTile label="MdRAE" value={fmtNum(bestResult.metrics.MdRAE)} />
              <MetricTile label="GMRAE" value={fmtNum(bestResult.metrics.GMRAE)} />
              <MetricTile label="RSFE" value={fmtNum(bestResult.metrics.RSFE)} />
            </div>
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 12,
                fontSize: 13,
                color: "var(--ink)",
                lineHeight: 1.55,
              }}
            >
              <strong style={{ color: "#10b981", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em" }}>
                VERDICT
              </strong>
              <br />
              {data.best_model_reason}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ==========================================================================
   Helpers — formatting + chart drawing (set innerHTML on SVG refs).
   ========================================================================== */

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function MetricTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="metric-tile">
      <div className="l">{label}</div>
      <div className={`v${accent ? " grad-text" : ""}`}>{value}</div>
    </div>
  );
}

function downloadForecastCsv(data: ForecastResponse) {
  const best = data.results.find((r) => r.model === data.best_model) ?? data.results[0];
  const rows: string[] = ["t,actual,forecast"];
  const map = new Map<string, { actual?: number | null; forecast?: number | null }>();
  for (const p of data.train) {
    map.set(p.t, { ...(map.get(p.t) ?? {}), actual: p.y });
  }
  for (const p of data.test) {
    map.set(p.t, { ...(map.get(p.t) ?? {}), actual: p.y });
  }
  for (const p of best.forecast) {
    map.set(p.t, { ...(map.get(p.t) ?? {}), forecast: p.y });
  }
  const ordered = Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [t, vals] of ordered) {
    rows.push(`${t},${fmtCsv(vals.actual)},${fmtCsv(vals.forecast)}`);
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.dataset.filename.replace(/\.[^.]+$/, "")}-forecast.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtCsv(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  return String(v);
}

/* ----- chart: forecast (actual + best forecast + RMSE-based CI bands) -----
 *
 * Matches design `forecastlab/dashboard.html`:
 *   - Two stacked CI bands (90% outer, 50% inner) that widen with horizon
 *   - Forecast line visually continues from the last actual point
 *   - Glow filter + horizontal gradient on the forecast line
 *
 * Width of each band at horizon step i (1-indexed):
 *   half_i = z * RMSE * sqrt(1 + i / N_train)
 * where z = 1.645 for CI 90, z = 0.674 for CI 50 (Gaussian residuals).
 * sqrt growth approximates a random-walk error envelope.
 */

function drawForecast(svg: SVGSVGElement | null, data: ForecastResponse, setTooltip?: any) {
  if (!svg) return;
  const W = 900;
  const H = 360;
  const pad = 40;

  type Pt = { t: number; y: number; is_missing?: boolean; is_outlier?: boolean };

  const actual: Pt[] = [...data.train, ...data.test]
    .filter((p) => p.y !== null)
    .map((p) => ({ t: new Date(p.t).getTime(), y: p.y as number, is_missing: p.is_missing, is_outlier: p.is_outlier }));

  const bestResult = data.results.find((r) => r.model === data.best_model) ?? data.results[0];
  const forecast: Pt[] = bestResult.forecast
    .filter((p) => p.y !== null)
    .map((p) => ({ t: new Date(p.t).getTime(), y: p.y as number }));

  if (actual.length === 0 && forecast.length === 0) {
    svg.innerHTML = `<text x="50" y="180" fill="#5a5e85" font-family="JetBrains Mono" font-size="12">데이터 없음</text>`;
    if (setTooltip) setTooltip(null);
    return;
  }

  const rmse = bestResult.metrics.RMSE;
  const nTrain = Math.max(1, data.train.length);
  const ciScale = (i: number) => Math.sqrt(1 + i / nTrain);
  const Z95 = 1.96;
  const Z80 = 1.28;

  const lastActual: Pt | null = actual.length > 0 ? actual[actual.length - 1] : null;

  const upperOuter: Pt[] = forecast.map((p, i) => ({ t: p.t, y: p.y + Z95 * rmse * ciScale(i + 1) }));
  const lowerOuter: Pt[] = forecast.map((p, i) => ({ t: p.t, y: p.y - Z95 * rmse * ciScale(i + 1) }));
  const upperInner: Pt[] = forecast.map((p, i) => ({ t: p.t, y: p.y + Z80 * rmse * ciScale(i + 1) }));
  const lowerInner: Pt[] = forecast.map((p, i) => ({ t: p.t, y: p.y - Z80 * rmse * ciScale(i + 1) }));

  if (lastActual) {
    upperOuter.unshift(lastActual);
    lowerOuter.unshift(lastActual);
    upperInner.unshift(lastActual);
    lowerInner.unshift(lastActual);
  }
  const forecastConnected: Pt[] = lastActual ? [lastActual, ...forecast] : forecast;

  const allTs = [...actual.map((p) => p.t), ...forecast.map((p) => p.t)];
  const allYs: number[] = [
    ...actual.map((p) => p.y),
    ...forecast.map((p) => p.y),
    ...upperOuter.map((p) => p.y),
    ...lowerOuter.map((p) => p.y),
  ];
  const xMin = Math.min(...allTs);
  const xMax = Math.max(...allTs);
  let yMin = Math.min(...allYs);
  let yMax = Math.max(...allYs);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const yPad = (yMax - yMin) * 0.1;
  yMin -= yPad;
  yMax += yPad;

  const sx = (t: number) => pad + ((t - xMin) / (xMax - xMin)) * (W - pad * 2);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - pad * 2);

  const pathOf = (pts: Pt[]) =>
    pts.map((p, i) => (i ? "L" : "M") + sx(p.t).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" ");

  const bandPath = (upper: Pt[], lower: Pt[]) =>
    pathOf(upper) + " L " + lower.slice().reverse().map((p) => sx(p.t).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" L ") + " Z";

  const grids: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = pad + (i * (H - pad * 2)) / 4;
    grids.push(`<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>`);
  }
  const labelCount = 7;
  const xLabels: string[] = [];
  for (let i = 0; i < labelCount; i++) {
    const t = xMin + ((xMax - xMin) * i) / (labelCount - 1);
    const x = sx(t);
    const d = new Date(t);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    xLabels.push(
      `<text x="${x.toFixed(1)}" y="${H - 12}" fill="#5a5e85" font-family="JetBrains Mono" font-size="9" text-anchor="middle">${label}</text>`
    );
  }

  const nowT = forecast.length > 0 ? forecast[0].t : actual.length > 0 ? actual[actual.length - 1].t : xMin;
  const nowX = sx(nowT);

  svg.innerHTML = `
    ${grids.join("")}
    ${xLabels.join("")}
    ${forecast.length > 0 ? `<path d="${bandPath(upperOuter, lowerOuter)}" fill="rgba(16,185,129,0.15)"/>` : ""}
    ${forecast.length > 0 ? `<path d="${bandPath(upperInner, lowerInner)}" fill="rgba(16,185,129,0.3)"/>` : ""}
    <line x1="${nowX.toFixed(1)}" y1="${pad}" x2="${nowX.toFixed(1)}" y2="${H - pad}" stroke="rgba(255,255,255,0.4)" stroke-dasharray="2 4"/>
    <text x="${(nowX + 6).toFixed(1)}" y="${pad + 14}" fill="#a4a8d0" font-family="JetBrains Mono" font-size="10" letter-spacing="2">FORECAST →</text>
    ${actual.length > 0 ? `<path d="${pathOf(actual)}" fill="none" stroke="#a4a8d0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
    ${forecastConnected.length > 1 ? `<path d="${pathOf(forecastConnected)}" fill="none" stroke="#10b981" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  `;

  if (setTooltip) {
    svg.onmousemove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const scaleX = W / rect.width;
      const svgX = clientX * scaleX;
      
      const hoverT = xMin + ((svgX - pad) / (W - pad * 2)) * (xMax - xMin);

      let closestDist = Infinity;
      let closestActual: Pt | null = null;
      for (const p of actual) {
         const d = Math.abs(p.t - hoverT);
         if (d < closestDist) { closestDist = d; closestActual = p; }
      }

      let closestForecast: Pt | null = null;
      let closestForecastIdx = -1;
      let fDist = Infinity;
      for (let i=0; i<forecast.length; i++) {
         const p = forecast[i];
         const d = Math.abs(p.t - hoverT);
         if (d < fDist) { fDist = d; closestForecast = p; closestForecastIdx = i; }
      }

      const threshold = (xMax - xMin) * 0.05;
      if (closestDist > threshold && fDist > threshold) {
         setTooltip(null);
         return;
      }

      let isForecast = false;
      let targetPt = closestActual;
      if (closestForecast && fDist < closestDist) {
         targetPt = closestForecast;
         isForecast = true;
      }

      if (!targetPt) return;

      const dStr = new Date(targetPt.t).toISOString().slice(0, 10);
      let html = "";
      if (isForecast) {
         const step = closestForecastIdx + 1;
         const u80 = targetPt.y + Z80 * rmse * ciScale(step);
         const l80 = targetPt.y - Z80 * rmse * ciScale(step);
         const u95 = targetPt.y + Z95 * rmse * ciScale(step);
         const l95 = targetPt.y - Z95 * rmse * ciScale(step);
         const w = u95 - l95;
         html = `
            <div style="color:#10b981;font-weight:600;margin-bottom:4px;">Date: ${dStr}</div>
            <div>Forecast: ${targetPt.y.toFixed(2)}</div>
            <div style="color:rgba(16,185,129,0.8)">80% CI: ${l80.toFixed(2)} ~ ${u80.toFixed(2)}</div>
            <div style="color:rgba(16,185,129,0.5)">95% CI: ${l95.toFixed(2)} ~ ${u95.toFixed(2)}</div>
            <div style="margin-top:4px;color:var(--ink-dim)">Uncertainty Width: ${w.toFixed(2)}</div>
            <div style="color:var(--ink-dim)">Model: ${MODEL_LABELS[data.best_model]}</div>
            <div style="color:var(--ink-dim)">Horizon: +${step}</div>
         `;
      } else {
         const missStr = targetPt.is_missing ? "true" : "false";
         const outStr = targetPt.is_outlier ? "true" : "false";
         html = `
            <div style="color:#a4a8d0;font-weight:600;margin-bottom:4px;">Date: ${dStr}</div>
            <div>Actual: ${targetPt.y.toFixed(2)}</div>
            <div style="color:${targetPt.is_missing ? '#ef4444' : 'var(--ink-dim)'}">Missing: ${missStr}</div>
            <div style="color:${targetPt.is_outlier ? '#ef4444' : 'var(--ink-dim)'}">Outlier: ${outStr}</div>
         `;
      }

      setTooltip({
         x: (sx(targetPt.t) / W) * 100 + "%",
         y: (sy(targetPt.y) / H) * 100 + "%",
         html
      });
    };

    svg.onmouseleave = () => setTooltip(null);
  }
}

/* ----- chart: decomposition (3 stacked subplots from train) -----
 * Matches design v=6: each subplot has an area fill (vertical gradient
 * fading to transparent), a thick glowing line on top via a doubled
 * Gaussian blur, and the label is rendered in the line color.
 */

function drawDecomp(svg: SVGSVGElement | null, values: number[], frequency: string | null, ts: number[]) {
  if (!svg) return;
  if (values.length < 6) {
    svg.innerHTML = `<text x="50" y="180" fill="#5a5e85" font-family="JetBrains Mono" font-size="12">분해를 위한 데이터가 부족합니다</text>`;
    return;
  }
  const W = 1200;
  const H = 360;
  const padL = 60;
  const padR = 40;
  const plotH = 80;
  const N = values.length;
  const period = inferPeriod(frequency, N);
  const { trend, seasonal, residual } = decomposeAdditive(values, period);

  const sx = (i: number) => padL + (i / (N - 1)) * (W - padL - padR);

  const subplot = (label: string, points: (number | null)[], color: string, gradId: string, yOffset: number) => {
    const validIdx: number[] = [];
    for (let i = 0; i < points.length; i++) if (points[i] !== null) validIdx.push(i);
    if (validIdx.length === 0) return "";
    const ys = validIdx.map((i) => points[i] as number);
    let mins = Math.min(...ys);
    let maxs = Math.max(...ys);
    if (mins === maxs) {
      mins -= 1;
      maxs += 1;
    }
    const range = maxs - mins;
    const mid = (mins + maxs) / 2;
    const sy = (v: number) => plotH - 6 - ((v - mins) / range) * (plotH - 12);
    
    const linePath = validIdx
      .map((i, k) => (k ? "L" : "M") + sx(i).toFixed(1) + " " + sy(points[i] as number).toFixed(1))
      .join(" ");
    const firstX = sx(validIdx[0]);
    const lastX = sx(validIdx[validIdx.length - 1]);
    const areaPath = `${linePath} L ${lastX.toFixed(1)} ${plotH} L ${firstX.toFixed(1)} ${plotH} Z`;
    
    const fmt = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1000) return v.toFixed(0);
      if (abs >= 10) return v.toFixed(1);
      return v.toFixed(2);
    };

    return `
      <g transform="translate(0,${yOffset})">
        <text x="${padL}" y="-10" fill="${color}" font-family="JetBrains Mono" font-size="11" font-weight="600" letter-spacing="3">${label}</text>
        <text x="${padL - 10}" y="${sy(maxs) + 4}" fill="#5a5e85" font-family="JetBrains Mono" font-size="9" text-anchor="end">${fmt(maxs)}</text>
        <text x="${padL - 10}" y="${sy(mid) + 4}" fill="#5a5e85" font-family="JetBrains Mono" font-size="9" text-anchor="end">${fmt(mid)}</text>
        <text x="${padL - 10}" y="${sy(mins) + 4}" fill="#5a5e85" font-family="JetBrains Mono" font-size="9" text-anchor="end">${fmt(mins)}</text>
        
        <line x1="${padL}" y1="${plotH / 2}" x2="${W - padR}" y2="${plotH / 2}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 4"/>
        <line x1="${padL}" y1="${plotH}" x2="${W - padR}" y2="${plotH}" stroke="rgba(255,255,255,0.15)"/>
        
        <path d="${areaPath}" fill="url(#${gradId})" opacity="0.3"/>
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;
  };

  const xLabels = [];
  const labelCount = 10;
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / (labelCount - 1)) * (N - 1));
    const x = sx(idx);
    const d = new Date(ts[idx]);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    xLabels.push(`<text x="${x.toFixed(1)}" y="${250 + plotH + 16}" fill="#5a5e85" font-family="JetBrains Mono" font-size="9" text-anchor="middle">${label}</text>`);
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#10b981" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#10b981" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="seasonalGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#06b6d4" stop-opacity="0.5"/>
        <stop offset="1" stop-color="#06b6d4" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="residualGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#6366f1" stop-opacity="0.45"/>
        <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${subplot("TREND", trend, "#10b981", "trendGrad", 30)}
    ${subplot("SEASONAL", seasonal as (number | null)[], "#06b6d4", "seasonalGrad", 140)}
    ${subplot("RESIDUAL", residual, "#6366f1", "residualGrad", 250)}
    ${xLabels.join("")}
  `;
}

/* ----- chart: ACF / PACF bar plot ----- */

function drawAcfChart(svg: SVGSVGElement | null, values: number[], kind: "acf" | "pacf") {
  if (!svg) return;
  const W = 360;
  const H = 130;
  const pad = 20;
  const maxLag = 23;

  if (values.length < 4) {
    svg.innerHTML = `<text x="20" y="${H / 2}" fill="#5a5e85" font-family="JetBrains Mono" font-size="11">데이터 부족</text>`;
    return;
  }

  const series = kind === "acf" ? acf(values, maxLag) : pacf(values, maxLag);
  const N = series.length;
  const halfH = H / 2 - 6;
  const ci = Math.min(1, 1.96 / Math.sqrt(values.length));
  const ciPx = ci * halfH;

  const bw = (W - pad * 2) / N - 4;
  const bars = series
    .map((v, i) => {
      const x = pad + i * ((W - pad * 2) / N);
      const clamped = Math.max(-1, Math.min(1, v));
      const h = Math.abs(clamped) * halfH;
      const y = clamped >= 0 ? H / 2 - h : H / 2;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="#10b981" rx="1"/>`;
    })
    .join("");

  svg.innerHTML = `
    <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" stroke="rgba(255,255,255,0.4)"/>
    <line x1="${pad}" y1="${(H / 2 - ciPx).toFixed(1)}" x2="${W - pad}" y2="${(H / 2 - ciPx).toFixed(1)}" stroke="#6366f1" stroke-width="1" stroke-dasharray="2 3" opacity="0.8"/>
    <line x1="${pad}" y1="${(H / 2 + ciPx).toFixed(1)}" x2="${W - pad}" y2="${(H / 2 + ciPx).toFixed(1)}" stroke="#6366f1" stroke-width="1" stroke-dasharray="2 3" opacity="0.8"/>
    ${bars}
  `;
}

// Suppress unused-import warning when types are referenced indirectly.
export type _Unused = ModelKey | ModelResult | SeriesPoint | MetricBundle;
