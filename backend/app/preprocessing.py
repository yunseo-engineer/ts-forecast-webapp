"""
Auto preprocessing pipeline.

Requirement 2.4 calls for an internal, non-interactive preprocessing
step with a "minimum correction" philosophy:

    - detect time column + value column
    - parse dates robustly
    - sort by time, drop duplicates
    - coerce value column to float
    - fill gaps in an appropriate way given the inferred frequency
    - return a clean pandas Series indexed by datetime
"""

from __future__ import annotations

from dataclasses import dataclass, field
from io import BytesIO
from typing import List, Optional

import numpy as np
import pandas as pd


@dataclass
class PreprocessResult:
    series: pd.Series  # DatetimeIndex, float dtype, no NaN
    time_column: str
    value_column: str
    frequency: Optional[str]
    notes: List[str] = field(default_factory=list)
    missing_count: int = 0
    missing_method: str = "없음"
    outlier_count: int = 0
    outlier_method: str = "없음"
    missing_mask: pd.Series = field(default_factory=lambda: pd.Series(dtype=bool))
    outliers_mask: pd.Series = field(default_factory=lambda: pd.Series(dtype=bool))


# Candidate header names we'll auto-detect.
_TIME_CANDIDATES = (
    "time", "timestamp", "date", "datetime", "ds", "period",
    "month", "day", "year", "week",
)


def _pick_time_column(df: pd.DataFrame) -> str:
    lower = {c.lower(): c for c in df.columns}
    for cand in _TIME_CANDIDATES:
        if cand in lower:
            return lower[cand]

    # Fallback: the column with the highest date-parsing success rate.
    best_col, best_rate = None, 0.0
    for c in df.columns:
        parsed = pd.to_datetime(df[c], errors="coerce", utc=False)
        rate = parsed.notna().mean()
        if rate > best_rate:
            best_rate, best_col = rate, c
    if best_col is None or best_rate < 0.5:
        raise ValueError("시간 열을 찾지 못했습니다. 날짜 형식의 열이 필요합니다.")
    return best_col


def _pick_value_column(df: pd.DataFrame, time_col: str) -> str:
    # Prefer the first numeric-like, non-time column.
    for c in df.columns:
        if c == time_col:
            continue
        s = pd.to_numeric(df[c], errors="coerce")
        if s.notna().mean() >= 0.5:
            return c
    raise ValueError("숫자 값 열을 찾지 못했습니다.")


def load_csv(raw: bytes) -> pd.DataFrame:
    # Try utf-8 first, fall back to cp949/euc-kr for Korean Excel exports.
    for enc in ("utf-8", "utf-8-sig", "cp949", "euc-kr", "latin-1"):
        try:
            return pd.read_csv(BytesIO(raw), encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError("CSV 파일의 인코딩을 해석할 수 없습니다.")


def preprocess(raw_bytes: bytes) -> PreprocessResult:
    notes: List[str] = []

    df = load_csv(raw_bytes)
    if df.shape[1] < 2:
        raise ValueError("CSV는 시간 열과 값 열, 최소 2개 열이 필요합니다.")

    time_col = _pick_time_column(df)
    value_col = _pick_value_column(df, time_col)
    notes.append(f"시간 열: '{time_col}', 값 열: '{value_col}' 로 인식했습니다.")

    # Parse times
    t = pd.to_datetime(df[time_col], errors="coerce")
    bad_t = int(t.isna().sum())
    if bad_t > 0:
        notes.append(f"시간 파싱 실패 {bad_t}개 행을 제거했습니다.")

    # Coerce values
    y = pd.to_numeric(df[value_col], errors="coerce")
    bad_y = int(y.isna().sum()) - bad_t
    if bad_y > 0:
        notes.append(f"값 파싱 실패 {bad_y}개 행을 결측으로 처리했습니다.")

    frame = pd.DataFrame({"t": t, "y": y}).dropna(subset=["t"])

    # Deduplicate timestamps by taking the mean (conservative).
    dup = int(frame.duplicated(subset=["t"]).sum())
    if dup > 0:
        notes.append(f"중복 시점 {dup}개를 평균 처리했습니다.")
    frame = frame.groupby("t", as_index=True, sort=True)["y"].mean()

    # Infer frequency and reindex to a complete grid if possible.
    freq = pd.infer_freq(frame.index)
    if freq is not None:
        full_idx = pd.date_range(frame.index.min(), frame.index.max(), freq=freq)
        n_before = int(frame.isna().sum())
        frame = frame.reindex(full_idx)
        n_gaps = int(frame.isna().sum()) - n_before
        if n_gaps > 0:
            notes.append(
                f"일정한 간격({freq}) 기준 빈 시점 {n_gaps}개를 삽입했습니다."
            )
    else:
        notes.append("일정한 시계열 주기를 추정할 수 없어 원본 간격을 유지합니다.")

    # Fill remaining NaNs using a light-touch strategy: time-interpolate if
    # the index is datetime; leave unfilled values as last resort.
    missing_mask = frame.isna()
    n_missing = int(missing_mask.sum())
    missing_method = "없음"
    if n_missing > 0:
        if isinstance(frame.index, pd.DatetimeIndex):
            frame = frame.interpolate(method="time", limit_direction="both")
            missing_method = "시간 보간 (Time Interpolation)"
        else:
            frame = frame.interpolate(method="linear", limit_direction="both")
            missing_method = "선형 보간 (Linear Interpolation)"
        notes.append(f"결측치 {n_missing}개를 {missing_method}으로 채웠습니다.")

    # If anything is still NaN (e.g. at the very edges), fill with nearest
    # observed value — minimal correction principle.
    if frame.isna().any():
        frame = frame.ffill().bfill()
        if missing_method == "없음":
            missing_method = "이전/이후 값 채우기 (ffill/bfill)"
            
    # Outlier detection
    outlier_count = 0
    outlier_method = "없음"
    outliers_mask = pd.Series(False, index=frame.index)
    
    if len(frame) >= 14:
        try:
            from statsmodels.tsa.seasonal import STL
            # Try STL if we have enough data and a discernible frequency
            from app.forecasting import _infer_seasonal_period
            period = _infer_seasonal_period(freq, len(frame))
            if period > 1 and len(frame) >= 2 * period:
                stl = STL(frame, period=period, robust=True).fit()
                resid = stl.resid
                outlier_method = "STL 잔차 IQR (STL Residuals IQR)"
            else:
                window = min(len(frame) // 5, 21)
                window = window + 1 if window % 2 == 0 else window
                window = max(3, window)
                rolling_med = frame.rolling(window=window, center=True, min_periods=1).median()
                resid = frame - rolling_med
                outlier_method = "이동 중앙값 잔차 IQR (Rolling Median Residual IQR)"
                
            q1 = resid.quantile(0.25)
            q3 = resid.quantile(0.75)
            iqr = q3 - q1
            
            # Using 3*IQR for strong outliers to avoid false positives
            lower_bound = q1 - 3 * iqr
            upper_bound = q3 + 3 * iqr
            
            outliers_mask = (resid < lower_bound) | (resid > upper_bound)
            outlier_count = int(outliers_mask.sum())
            
            if outlier_count > 0:
                frame.loc[outliers_mask] = np.nan
                # Re-interpolate outliers
                if isinstance(frame.index, pd.DatetimeIndex):
                    frame = frame.interpolate(method="time", limit_direction="both")
                else:
                    frame = frame.interpolate(method="linear", limit_direction="both")
                frame = frame.ffill().bfill()
                notes.append(f"이상치 {outlier_count}개를 탐지 및 보간 처리했습니다 ({outlier_method}).")
            else:
                outlier_method = "탐지된 이상치 없음"
        except Exception as e:
            notes.append(f"이상치 탐지 실패: {str(e)}")

    if len(frame) < 8:
        raise ValueError("유효한 시계열 포인트가 8개 미만입니다 — 예측이 불가합니다.")

    # Guard against constant series that break some models.
    if np.nanstd(frame.values) == 0:
        raise ValueError("값이 모두 동일해 예측 모델을 학습할 수 없습니다.")

    return PreprocessResult(
        series=frame.astype(float),
        time_column=time_col,
        value_column=value_col,
        frequency=freq,
        notes=notes,
        missing_count=n_missing,
        missing_method=missing_method,
        outlier_count=outlier_count,
        outlier_method=outlier_method,
        missing_mask=missing_mask,
        outliers_mask=outliers_mask,
    )
