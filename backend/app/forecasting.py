"""
Forecasting models (requirement 2.5) + best-model selection (2.10).

Each model implements the same protocol:

    fit_predict(series, test_len, horizon) -> (fitted, test_pred, forecast)

Where:
    fitted     : in-sample fitted values, pandas Series indexed like the train segment
    test_pred  : predictions for the held-out test segment
    forecast   : future predictions of length `horizon`
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional

import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing

from .metrics import compute_all

ModelKey = str  # "moving_average" | "ses" | "holt" | "holt_winters" | "poly_trend"


@dataclass
class ModelOutput:
    model: ModelKey
    fitted: pd.Series
    test_pred: pd.Series
    forecast: pd.Series
    metrics: Dict[str, Optional[float]]
    notes: str = ""


# --------------------------------------------------------------------------- #
#  Individual models
# --------------------------------------------------------------------------- #

def _future_index(last_ts: pd.Timestamp, horizon: int, freq: Optional[str]) -> pd.DatetimeIndex:
    """Build the forecast horizon's timestamp index."""
    if freq:
        return pd.date_range(start=last_ts, periods=horizon + 1, freq=freq)[1:]
    # Fallback: infer median spacing.
    return pd.date_range(start=last_ts, periods=horizon + 1, freq="D")[1:]


def _moving_average(
    train: pd.Series, test: pd.Series, horizon: int, window: int = 3
) -> ModelOutput:
    w = max(2, min(window, max(2, len(train) // 4)))
    fitted = train.rolling(window=w, min_periods=1).mean()

    # One-step-ahead test predictions use the tail of train + walk forward on actuals.
    history = list(train.values)
    preds = []
    for actual in test.values:
        preds.append(float(np.mean(history[-w:])))
        history.append(float(actual))
    test_pred = pd.Series(preds, index=test.index, name="pred")

    # Future forecast: recursive, replacing actuals with our own predictions.
    fut_vals = []
    buf = list(train.values) + list(test.values)
    for _ in range(horizon):
        nxt = float(np.mean(buf[-w:]))
        fut_vals.append(nxt)
        buf.append(nxt)
    future_idx = _future_index(test.index[-1], horizon, pd.infer_freq(test.index))
    forecast = pd.Series(fut_vals, index=future_idx, name="forecast")

    return ModelOutput(
        model="moving_average",
        fitted=fitted,
        test_pred=test_pred,
        forecast=forecast,
        metrics={},
        notes=f"window={w}",
    )


def _ses(train: pd.Series, test: pd.Series, horizon: int) -> ModelOutput:
    model = SimpleExpSmoothing(train, initialization_method="estimated").fit(
        optimized=True
    )
    fitted = model.fittedvalues
    # SES is flat; we can get the whole test+horizon in one forecast call.
    total_fc = model.forecast(len(test) + horizon)
    test_pred = pd.Series(total_fc.values[: len(test)], index=test.index, name="pred")
    future_idx = _future_index(test.index[-1], horizon, pd.infer_freq(test.index))
    forecast = pd.Series(total_fc.values[len(test):], index=future_idx, name="forecast")
    return ModelOutput("ses", fitted, test_pred, forecast, metrics={})


def _holt(train: pd.Series, test: pd.Series, horizon: int) -> ModelOutput:
    model = ExponentialSmoothing(
        train, trend="add", seasonal=None, initialization_method="estimated"
    ).fit(optimized=True)
    fitted = model.fittedvalues
    total_fc = model.forecast(len(test) + horizon)
    test_pred = pd.Series(total_fc.values[: len(test)], index=test.index, name="pred")
    future_idx = _future_index(test.index[-1], horizon, pd.infer_freq(test.index))
    forecast = pd.Series(total_fc.values[len(test):], index=future_idx, name="forecast")
    return ModelOutput("holt", fitted, test_pred, forecast, metrics={})


def _holt_winters(
    train: pd.Series, test: pd.Series, horizon: int, seasonal_periods: int
) -> ModelOutput:
    # Fall back to Holt (no seasonality) if the data is too short or non-seasonal.
    sp = seasonal_periods if seasonal_periods >= 2 and len(train) >= 2 * seasonal_periods else None
    if sp is None:
        out = _holt(train, test, horizon)
        out.model = "holt_winters"
        out.notes = "계절성 추정 불가 → Holt 모델로 대체"
        return out

    model = ExponentialSmoothing(
        train,
        trend="add",
        seasonal="add",
        seasonal_periods=sp,
        initialization_method="estimated",
    ).fit(optimized=True)
    fitted = model.fittedvalues
    total_fc = model.forecast(len(test) + horizon)
    test_pred = pd.Series(total_fc.values[: len(test)], index=test.index, name="pred")
    future_idx = _future_index(test.index[-1], horizon, pd.infer_freq(test.index))
    forecast = pd.Series(total_fc.values[len(test):], index=future_idx, name="forecast")
    return ModelOutput(
        "holt_winters", fitted, test_pred, forecast, metrics={}, notes=f"seasonal_periods={sp}"
    )


def _poly_trend(
    train: pd.Series, test: pd.Series, horizon: int, degree: int = 2
) -> ModelOutput:
    n_train = len(train)
    x_train = np.arange(n_train, dtype=float)
    coefs = np.polyfit(x_train, train.values, deg=degree)
    poly = np.poly1d(coefs)

    fitted = pd.Series(poly(x_train), index=train.index, name="fitted")

    x_test = np.arange(n_train, n_train + len(test), dtype=float)
    test_pred = pd.Series(poly(x_test), index=test.index, name="pred")

    x_fut = np.arange(n_train + len(test), n_train + len(test) + horizon, dtype=float)
    future_idx = _future_index(test.index[-1], horizon, pd.infer_freq(test.index))
    forecast = pd.Series(poly(x_fut), index=future_idx, name="forecast")

    return ModelOutput(
        "poly_trend", fitted, test_pred, forecast, metrics={}, notes=f"degree={degree}"
    )


# --------------------------------------------------------------------------- #
#  Orchestration
# --------------------------------------------------------------------------- #

def _infer_seasonal_period(freq: Optional[str], n: int) -> int:
    if freq is None:
        return 1
    f = freq.upper()
    if f.startswith("M"):
        return 12 if n >= 24 else 1
    if f.startswith("Q"):
        return 4 if n >= 8 else 1
    if f.startswith("W"):
        return 52 if n >= 104 else 1
    if f.startswith("D"):
        return 7 if n >= 14 else 1
    if f.startswith("H"):
        return 24 if n >= 48 else 1
    return 1


def _split_train_test(series: pd.Series) -> Tuple[pd.Series, pd.Series]:
    n = len(series)
    # Use ~20% for test, with sensible bounds.
    test_len = max(4, min(int(round(n * 0.2)), 60))
    if test_len >= n - 3:
        test_len = max(3, n // 5)
    return series.iloc[: n - test_len], series.iloc[n - test_len :]


def run_all_models(series: pd.Series, horizon: int, freq: Optional[str]) -> List[ModelOutput]:
    train, test = _split_train_test(series)
    sp = _infer_seasonal_period(freq, len(train))

    y_train = train.values.astype(float)
    y_true = test.values.astype(float)

    outputs: List[ModelOutput] = []

    for runner in (
        lambda: _moving_average(train, test, horizon),
        lambda: _ses(train, test, horizon),
        lambda: _holt(train, test, horizon),
        lambda: _holt_winters(train, test, horizon, seasonal_periods=sp),
        lambda: _poly_trend(train, test, horizon),
    ):
        try:
            out = runner()
            out.metrics = compute_all(
                y_true=y_true,
                y_pred=out.test_pred.values.astype(float),
                y_train=y_train,
                seasonal_period=max(1, sp),
            )
            outputs.append(out)
        except Exception as e:  # pragma: no cover — defensive; a single model failure shouldn't kill the request
            outputs.append(
                ModelOutput(
                    model=str(e) or "unknown",
                    fitted=pd.Series(dtype=float),
                    test_pred=pd.Series(dtype=float),
                    forecast=pd.Series(dtype=float),
                    metrics={},
                    notes=f"failed: {e}",
                )
            )

    return outputs


def pick_best_model(outputs: List[ModelOutput]) -> Tuple[str, str]:
    """
    Pick the best model via a simple composite rank over stable, scale-aware metrics.

    We explicitly avoid choosing purely on MAPE (unstable near 0) and avoid using
    RSFE/TS as the primary signal since those are bias diagnostics, not error size.
    """
    candidates = [o for o in outputs if o.metrics and np.isfinite(o.metrics.get("RMSE", np.nan))]
    if not candidates:
        return outputs[0].model, "유효한 모델이 없어 첫 번째 결과를 반환했습니다."

    # Rank each candidate (lower = better). Sum ranks across chosen metrics.
    keys = ("RMSE", "MAE", "SMAPE")
    ranks = {o.model: 0 for o in candidates}
    for k in keys:
        ordered = sorted(candidates, key=lambda o: o.metrics.get(k) or math.inf)
        for rank, o in enumerate(ordered):
            ranks[o.model] += rank

    best = min(candidates, key=lambda o: ranks[o.model])
    reason = (
        f"RMSE · MAE · SMAPE 종합 순위에서 1위입니다 "
        f"(RMSE={best.metrics['RMSE']:.4g}, MAE={best.metrics['MAE']:.4g})."
    )
    return best.model, reason
