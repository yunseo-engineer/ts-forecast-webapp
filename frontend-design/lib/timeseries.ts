// Lightweight client-side time-series helpers for things the backend
// does not return today (ACF, PACF, additive decomposition, model
// spread bands). All operate on pre-cleaned numeric arrays — null gaps
// must be filtered upstream.

export function mean(xs: number[]): number {
  if (!xs.length) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample autocovariance at lag k (biased estimator, divides by n). */
function autocov(xs: number[], k: number, mu: number): number {
  let s = 0;
  for (let i = 0; i < xs.length - k; i++) s += (xs[i] - mu) * (xs[i + k] - mu);
  return s / xs.length;
}

/** Autocorrelation (ACF) up to and including `maxLag`. acf[0] = 1. */
export function acf(xs: number[], maxLag: number): number[] {
  if (xs.length < 2) return new Array(maxLag + 1).fill(0);
  const mu = mean(xs);
  const c0 = autocov(xs, 0, mu);
  const out: number[] = [];
  for (let k = 0; k <= maxLag; k++) out.push(c0 === 0 ? 0 : autocov(xs, k, mu) / c0);
  return out;
}

/**
 * Partial autocorrelation (PACF) via Durbin–Levinson recursion.
 * Returns array length maxLag + 1 with pacf[0] = 1.
 */
export function pacf(xs: number[], maxLag: number): number[] {
  const r = acf(xs, maxLag);
  const out = new Array(maxLag + 1).fill(0);
  out[0] = 1;
  if (maxLag < 1) return out;

  // phi[k][j] holds the j-th coefficient of the AR(k) model.
  const phi: number[][] = Array.from({ length: maxLag + 1 }, () => new Array(maxLag + 1).fill(0));
  phi[1][1] = r[1];
  out[1] = r[1];

  for (let k = 2; k <= maxLag; k++) {
    let num = r[k];
    let den = 1;
    for (let j = 1; j < k; j++) {
      num -= phi[k - 1][j] * r[k - j];
      den -= phi[k - 1][j] * r[j];
    }
    const phikk = den === 0 ? 0 : num / den;
    phi[k][k] = phikk;
    out[k] = phikk;
    for (let j = 1; j < k; j++) {
      phi[k][j] = phi[k - 1][j] - phikk * phi[k - 1][k - j];
    }
  }
  return out;
}

/**
 * Centered rolling mean. Returns same length; window/2 leading and
 * trailing slots are null (insufficient neighbours).
 */
export function rollingMean(xs: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(xs.length).fill(null);
  if (window <= 1 || xs.length < window) return out;
  const half = Math.floor(window / 2);
  for (let i = half; i < xs.length - half; i++) {
    let s = 0;
    for (let j = -half; j <= half; j++) s += xs[i + j];
    out[i] = s / window;
  }
  return out;
}

export interface Decomposition {
  trend: (number | null)[];
  seasonal: number[];
  residual: (number | null)[];
}

/**
 * Simple additive decomposition: trend = centered rolling mean of period;
 * seasonal = mean of detrended values per phase, centered to zero;
 * residual = x - trend - seasonal.
 */
export function decomposeAdditive(xs: number[], period: number): Decomposition {
  const w = Math.max(2, period);
  const trend = rollingMean(xs, w);
  const detrended: (number | null)[] = xs.map((x, i) => (trend[i] === null ? null : x - (trend[i] as number)));

  // Average detrended by phase.
  const phaseSum = new Array(period).fill(0);
  const phaseCnt = new Array(period).fill(0);
  detrended.forEach((v, i) => {
    if (v !== null) {
      phaseSum[i % period] += v;
      phaseCnt[i % period] += 1;
    }
  });
  const phaseAvg = phaseSum.map((s, i) => (phaseCnt[i] > 0 ? s / phaseCnt[i] : 0));
  const center = mean(phaseAvg);
  const seasonalCentered = phaseAvg.map((v) => v - center);

  const seasonal = xs.map((_, i) => seasonalCentered[i % period]);
  const residual = xs.map((x, i) => (trend[i] === null ? null : x - (trend[i] as number) - seasonal[i]));

  return { trend, seasonal, residual };
}

/**
 * Heuristic period from a frequency string returned by the backend.
 * Backend uses pandas-style frequency aliases (D, W, MS, M, Q, Y).
 * For weekly cycles we look at daily; for yearly cycles we look at the
 * relevant sub-period that fits in a typical series.
 */
export function inferPeriod(frequency: string | null | undefined, n: number): number {
  const f = (frequency ?? "").toUpperCase();
  if (f.startsWith("D")) return n >= 28 ? 7 : 1;          // weekly cycle in daily data
  if (f.startsWith("W")) return n >= 104 ? 52 : 4;        // yearly cycle in weekly data
  if (f.startsWith("M")) return n >= 24 ? 12 : 4;         // yearly cycle in monthly data
  if (f.startsWith("Q")) return 4;
  if (f.startsWith("H")) return 24;
  return Math.min(12, Math.max(2, Math.floor(n / 4)));
}
