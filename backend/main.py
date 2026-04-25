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
        },
        "horizon": horizon,
        "train": _series_to_points(train),
        "test": _series_to_points(test),
        "results": [_model_result_to_json(o) for o in outputs],
        "best_model": best_model,
        "best_model_reason": reason,
    }
