# Chronos — Time Series Forecasting Web App

단변량 시계열 CSV 파일을 업로드하면 자동으로 전처리하고, 여러 예측 모델을
동시에 실행하여 결과를 대시보드로 비교·검증할 수 있는 웹 애플리케이션의
**베이스라인 프로젝트**입니다.

---

## 구성

```
timeseries-forecast-app/
├── frontend/                 # Next.js 14 · TypeScript · Tailwind · Zustand · Recharts
│   ├── app/
│   │   ├── page.tsx          # 랜딩 페이지 (중앙 정렬, 검정/회색 톤, 그라데이션)
│   │   └── dashboard/
│   │       └── page.tsx      # 분석 대시보드
│   ├── components/
│   │   ├── landing/          # Header · Hero · FileUploadBox · FeatureHighlights · Footer
│   │   ├── dashboard/        # DashboardHeader · HorizonControl · ForecastChart ·
│   │   │                     # MetricsTable · MetricGroupChart · BiasCard · BestModelCard ...
│   │   └── ui/               # Button · Card · Badge · Spinner
│   ├── lib/                  # 타입 정의 + API 클라이언트
│   └── store/                # Zustand 전역 상태 (파일 · 시평 · 결과 · 오류)
│
└── backend/                  # FastAPI · pandas · statsmodels
    ├── main.py               # POST /api/forecast
    └── app/
        ├── preprocessing.py  # 자동 전처리 파이프라인
        ├── forecasting.py    # 5개 예측 모델 + 최적 모델 선정
        └── metrics.py        # MAE · MSE · RMSE · MAPE · SMAPE · MASE · MdRAE · GMRAE · RSFE · TS
```

### 컴포넌트 분리 원칙

**모든 페이지는 독립된 컴포넌트의 조합으로만 구성**되어 있습니다.
예를 들어 히어로 문구를 수정하려면 `components/landing/Hero.tsx`만 수정하면 되며,
CTA 버튼 위치를 바꾸려면 `app/page.tsx`의 컴포넌트 순서만 변경하면 됩니다.
대시보드 패널 또한 `app/dashboard/page.tsx`에서 재배열·추가·제거가 가능합니다.

---

## 기능 요구사항 매핑

| 요구사항 | 구현 위치 |
|---|---|
| 2.1 CSV 업로드 | `components/landing/FileUploadBox.tsx` |
| 2.2 파일 변경 시 자동 재예측 | `store/appStore.ts` (`setFile` 이 캐시 초기화) |
| 2.3 예측시평 변경 | `components/dashboard/HorizonControl.tsx` |
| 2.4 자동 전처리 | `backend/app/preprocessing.py` |
| 2.5 다중 예측 모델 | `backend/app/forecasting.py` (5개 모델) |
| 2.6 모델별 비교 시각화 | `components/dashboard/ForecastChart.tsx` + `ModelSelector.tsx` |
| 2.7 모든 평가지표 계산 | `backend/app/metrics.py` (10개 지표) |
| 2.8 평가지표 대시보드 | `MetricsTable` + `MetricGroupChart` + `BiasCard` |
| 2.9 예측 시각화 | `ForecastChart` (학습 / 테스트 / 미래 구간 색상 구분) |
| 2.10 최적 모델 추천 | `forecasting.py::pick_best_model` + `BestModelCard` |

---

## 실행 방법

### 1. 백엔드 (FastAPI)

```bash
cd backendu
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

`http://localhost:8000/api/health` 에 접속하여 `{"ok": true}` 가 반환되는지 확인하세요.

### 2. 프론트엔드 (Next.js)

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:3000` 에서 랜딩 페이지를 확인할 수 있습니다.
개발 환경에서는 Next.js 의 `rewrites` 설정이 `/api/*` 요청을
`http://localhost:8000` 의 FastAPI 서버로 프록시합니다.

#### 백엔드 URL 변경

프론트엔드가 다른 호스트의 백엔드를 사용해야 한다면:

```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend.example.com
```

---

## CSV 형식

- 시간 열 1개 + 값 열 1개의 **단변량** 시계열
- 시간 열 이름은 `date`, `datetime`, `time`, `timestamp`, `ds`, `period`, `month` 등으로 인식
- 값 열은 숫자로 파싱 가능한 첫 번째 비시간 열을 자동 선택
- 한글 CSV (cp949, euc-kr 인코딩)도 자동 인식

예시:

```csv
date,value
2020-01-01,120.5
2020-02-01,132.1
2020-03-01,141.0
...
```

---

## 내장 예측 모델

| 키 | 모델 |
|---|---|
| `moving_average` | 이동평균 (window 자동 설정) |
| `ses` | Simple Exponential Smoothing |
| `holt` | Holt 선형 추세 |
| `holt_winters` | Holt-Winters 계절 (주기는 빈도에서 자동 추정, 계절성 부재 시 Holt 로 대체) |
| `poly_trend` | 2차 다항식 추세 |

모델을 추가하려면 `backend/app/forecasting.py` 의 `run_all_models()` 튜플에
새 함수를 추가하고, 프론트엔드의 `lib/types.ts` 의 `MODEL_LABELS` 에
키와 라벨을 추가하세요.

---

## 라이선스

내부 학습·프로젝트 용도 베이스라인.
