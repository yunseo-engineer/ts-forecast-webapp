"""
FastAPI entrypoint.

Single endpoint: POST /api/forecast (multipart form with `file` + `horizon`).
Returns everything the dashboard needs in one response, so the frontend doesn't
need to orchestrate multiple requests.
"""

from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.forecasting import ModelOutput, pick_best_model, run_all_models
from app.preprocessing import preprocess

app = FastAPI(title="Chronos Forecasting API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _series_to_points(s: pd.Series) -> List[dict]:
    out = []
    for ts, v in s.items():
        t = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        if v is None or (isinstance(v, float) and not np.isfinite(v)):
            out.append({"t": t, "y": None})
        else:
            out.append({"t": t, "y": float(v)})
    return out


def _series_to_points_with_meta(s: pd.Series, missing_mask: pd.Series, outliers_mask: pd.Series) -> List[dict]:
    out = []
    for ts, v in s.items():
        t = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        is_missing = bool(missing_mask.get(ts, False))
        is_outlier = bool(outliers_mask.get(ts, False))
        if v is None or (isinstance(v, float) and not np.isfinite(v)):
            out.append({"t": t, "y": None, "is_missing": is_missing, "is_outlier": is_outlier})
        else:
            out.append({"t": t, "y": float(v), "is_missing": is_missing, "is_outlier": is_outlier})
    return out


def _model_result_to_json(m: ModelOutput) -> dict:
    return {
        "model": m.model,
        "fitted": _series_to_points(m.fitted),
        "test_pred": _series_to_points(m.test_pred),
        "forecast": _series_to_points(m.forecast),
        "metrics": m.metrics,
        "notes": m.notes,
    }


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/forecast")
async def forecast(
    file: UploadFile = File(...),
    horizon: int = Form(12),
):
    if horizon < 1 or horizon > 500:
        raise HTTPException(status_code=400, detail="horizon은 1 이상 500 이하로 입력하세요.")

    try:
        raw = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="파일을 읽을 수 없습니다.")

    try:
        pre = preprocess(raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    series = pre.series

    # Split just for reporting; the actual split happens inside run_all_models.
    n = len(series)
    test_len = max(4, min(int(round(n * 0.2)), 60))
    if test_len >= n - 3:
        test_len = max(3, n // 5)
    train = series.iloc[: n - test_len]
    test = series.iloc[n - test_len :]

    try:
        outputs = run_all_models(series, horizon=horizon, freq=pre.frequency)
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"예측 실행 중 오류: {e}")

    best_model, reason = pick_best_model(outputs)

    from statsmodels.tsa.stattools import adfuller
    from statsmodels.stats.diagnostic import acorr_ljungbox

    try:
        adf_res = adfuller(series.dropna())
        adf_stat, adf_pvalue = float(adf_res[0]), float(adf_res[1])
    except Exception:
        adf_stat, adf_pvalue = None, None
        
    try:
        lb_res = acorr_ljungbox(series.dropna(), lags=[min(10, max(1, len(series) // 5))], return_df=True)
        ljung_box_stat = float(lb_res.iloc[0]["lb_stat"])
        ljung_box_pvalue = float(lb_res.iloc[0]["lb_pvalue"])
    except Exception:
        ljung_box_stat, ljung_box_pvalue = None, None

    # First-N preview of the raw cleaned series for the frontend.
    preview = _series_to_points(series.iloc[: min(50, len(series))])

    return {
        "dataset": {
            "filename": file.filename,
            "rows": int(n),
            "time_column": pre.time_column,
            "value_column": pre.value_column,
            "start": series.index.min().isoformat(),
            "end": series.index.max().isoformat(),
            "frequency": pre.frequency,
            "preprocessing_notes": pre.notes,
            "preview": preview,
            "statistics": {
                "missing_count": pre.missing_count,
                "missing_method": pre.missing_method,
                "outlier_count": pre.outlier_count,
                "outlier_method": pre.outlier_method,
                "adf_stat": adf_stat,
                "adf_pvalue": adf_pvalue,
                "ljung_box_stat": ljung_box_stat,
                "ljung_box_pvalue": ljung_box_pvalue,
            }
        },
        "horizon": horizon,
        "train": _series_to_points_with_meta(train, pre.missing_mask, pre.outliers_mask),
        "test": _series_to_points_with_meta(test, pre.missing_mask, pre.outliers_mask),
        "results": [_model_result_to_json(o) for o in outputs],
        "best_model": best_model,
        "best_model_reason": reason,
    }
