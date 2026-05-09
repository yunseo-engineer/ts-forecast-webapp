# ForecastLab Frontend

기존 시스템(`../frontend`, port 3000)을 그대로 둔 채, **Claude Design** 핸드오프를 적용한 별도 Next.js 14 프론트엔드. 백엔드(`../backend`, port 8000)는 공유한다.

## 실행

```bash
# 1. 백엔드 (없으면 먼저 띄우기)
cd ../backend
uvicorn main:app --reload   # :8000

# 2. 새 프론트엔드
cd ../frontend-design
npm install
npm run dev                  # :3001
```

브라우저: `http://localhost:3001`

## 폴더

```
frontend-design/
├── app/
│   ├── globals.css        # 디자인 시스템 + 랜딩 페이지 스타일 (shared.css + landing.html <style>)
│   ├── layout.tsx         # 폰트 로드 (Pretendard, Syne, Inter, JetBrains Mono)
│   └── page.tsx           # 랜딩 페이지 (landing.html → JSX)
├── public/
│   └── forecastlab/
│       ├── landing.js     # 인터랙션 (커서 블롭, reveal, 단어 분리, 모델 스파크) — 디자인에서 그대로
│       └── hero-visuals.js # 4종 hero SVG 차트 (line, wave, band, particle)
├── components/            # (미사용 — 향후 분리할 때)
├── lib/
│   ├── api.ts             # POST /api/forecast (백엔드 동일)
│   ├── types.ts           # 백엔드 응답 타입 (frontend와 동일)
│   └── utils.ts           # cn() 유틸
├── store/
│   └── appStore.ts        # Zustand (frontend와 동일)
├── design/
│   ├── README.md          # 디자인 핸드오프 적용 워크플로우
│   ├── tokens.json        # 색상/폰트 토큰 (SSOT)
│   └── exports/younseo-01/ # Claude Design 핸드오프 원본
├── next.config.js         # /api/* → :8000 프록시 (frontend와 동일)
├── tailwind.config.ts     # 디자인 토큰 매핑
└── package.json           # next dev -p 3001
```

## 백엔드 통신

`next.config.js`의 rewrites가 `/api/*` → `http://localhost:8000/api/*`로 프록시한다. 환경변수 `NEXT_PUBLIC_BACKEND_URL`로 호스트 변경 가능.

## 디자인 갱신

새 Claude Design 핸드오프를 받으면 `design/README.md`의 절차를 따라 적용한다.

## 라우트 (현재 구현 상태)

| 경로 | 상태 |
|------|------|
| `/` | ✅ 랜딩 (`landing.html` 포팅 — Claude Design v=5, Emerald·Cyan·Indigo 팔레트) |
| `/upload` | ✅ 업로드 + 분석 설정 (`upload.html` 포팅 — 드래그앤드롭, horizon 슬라이더, 로딩 페이즈 애니메이션) |
| `/dashboard` | ✅ 분석 결과 대시보드 (`dashboard.html` 포팅 — Forecast/Decomposition/ACF·PACF/Model 표/Metric 타일, 모킹 데이터) |

> 현재 dashboard는 디자인 프로토타입의 **모킹 데이터**를 그대로 보여줍니다. 실제 백엔드 응답으로 차트를 그리려면 `lib/api.ts` + `store/appStore.ts`의 `fetchForecast()`로 받은 데이터를 SVG 생성 함수에 매핑하면 됩니다 (`app/dashboard/page.tsx`의 `drawForecast`/`drawDecomp` 등을 참고).
