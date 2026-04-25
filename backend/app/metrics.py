"""
Evaluation metrics (requirement 2.7).

Every metric accepts aligned 1-D numpy arrays:
    y_true : actual values on the test segment
    y_pred : model predictions on the same segment
    y_train: training history (needed for MASE / MdRAE / GMRAE naive baselines)

Edge-cases that would divide by zero or take log(0) are returned as None so the
frontend can display "—" instead of NaN or inf.
"""

from __future__ import annotations

import math
from typing import Dict, Optional

import numpy as np

_EPS = 1e-12


def _safe_mean(x: np.ndarray) -> float:
    x = x[np.isfinite(x)]
    return float(x.mean()) if x.size else float("nan")


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def mse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean((y_true - y_pred) ** 2))


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return math.sqrt(mse(y_true, y_pred))


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> Optional[float]:
    # MAPE is unstable when actuals are near zero — return None if so.
    denom = np.abs(y_true)
    if np.any(denom < _EPS):
        return None
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    denom = np.where(denom < _EPS, _EPS, denom)
    return float(np.mean(np.abs(y_true - y_pred) / denom) * 100.0)


def mase(
    y_true: np.ndarray, y_pred: np.ndarray, y_train: np.ndarray, m: int = 1
) -> Optional[float]:
    # Scale = mean absolute seasonal-naive error on the training set.
    if len(y_train) <= m:
        return None
    naive_err = np.abs(y_train[m:] - y_train[:-m])
    scale = np.mean(naive_err)
    if not np.isfinite(scale) or scale < _EPS:
        return None
    return float(np.mean(np.abs(y_true - y_pred)) / scale)


def _rae(y_true: np.ndarray, y_pred: np.ndarray, y_train: np.ndarray) -> Optional[np.ndarray]:
    # Relative Absolute Error vs. naive one-step forecast (last observed train value).
    last = y_train[-1]
    naive = np.full_like(y_true, fill_value=last, dtype=float)
    num = np.abs(y_true - y_pred)
    den = np.abs(y_true - naive)
    den = np.where(den < _EPS, _EPS, den)
    return num / den


def mdrae(y_true: np.ndarray, y_pred: np.ndarray, y_train: np.ndarray) -> Optional[float]:
    r = _rae(y_true, y_pred, y_train)
    if r is None or r.size == 0:
        return None
    return float(np.median(r))


def gmrae(y_true: np.ndarray, y_pred: np.ndarray, y_train: np.ndarray) -> Optional[float]:
    r = _rae(y_true, y_pred, y_train)
    if r is None or r.size == 0:
        return None
    r = np.where(r < _EPS, _EPS, r)  # geometric mean requires positive values
    return float(np.exp(np.mean(np.log(r))))


def rsfe(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    # Running Sum of Forecast Errors (cumulative signed error).
    return float(np.sum(y_true - y_pred))


def tracking_signal(y_true: np.ndarray, y_pred: np.ndarray) -> Optional[float]:
    mad = float(np.mean(np.abs(y_true - y_pred)))
    if mad < _EPS:
        return None
    return rsfe(y_true, y_pred) / mad


def compute_all(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_train: np.ndarray,
    seasonal_period: int = 1,
) -> Dict[str, Optional[float]]:
    """Compute the full metric bundle. Returns a dict matching MetricBundle on the frontend."""
    return {
        "MAE": mae(y_true, y_pred),
        "MSE": mse(y_true, y_pred),
        "RMSE": rmse(y_true, y_pred),
        "MAPE": mape(y_true, y_pred),
        "SMAPE": smape(y_true, y_pred),
        "MASE": mase(y_true, y_pred, y_train, m=max(1, seasonal_period)),
        "MdRAE": mdrae(y_true, y_pred, y_train),
        "GMRAE": gmrae(y_true, y_pred, y_train),
        "RSFE": rsfe(y_true, y_pred),
        "TS": tracking_signal(y_true, y_pred),
    }
