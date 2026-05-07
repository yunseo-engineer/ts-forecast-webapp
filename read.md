# ForecastLab — AI 기반 시계열 데이터 분석 및 예측 플랫폼

**ForecastLab**은 사용자가 업로드한 시계열 데이터를 분석하고, 최적의 통계 모델을 통해 미래 데이터를 예측하는 올인원 웹 애플리케이션입니다. 복잡한 설정 없이 단 한 번의 업로드로 전문가 수준의 분석 결과와 리포트를 제공합니다.

---

## 🔗 배포 링크
> **[ForecastLab 서비스 바로가기](https://forecastlab-pro.vercel.app/)**  
> *(현재 Vercel 및 Render를 통해 배포된 상태입니다.)*

---

## ✨ 주요 기능

### 1. 강력한 자동 전처리 (Auto-Preprocessing)
- **결측치 보간**: Linear, Time, Forward-fill 등 데이터 특성에 맞는 자동 보간 수행.
- **이상치 탐지 및 처리**: IQR 방식을 통한 이상치 자동 식별 및 보정.
- **정상성 분석**: ADF Test를 통한 데이터의 정상성 확인 및 분석.

### 2. 다중 예측 엔진 (Multi-Model Engine)
- **4가지 핵심 모델 동시 실행**:
    - **ARIMA / SARIMA**: 데이터의 자기상관을 이용한 전통적 통계 모델.
    - **Holt-Winter's**: 추세(Trend)와 계절성(Seasonality)을 모두 고려한 모델.
    - **Holt's Exponential Smoothing**: 선형 추세 추종에 특화된 모델.
    - **ETS (Error-Trend-Seasonal)**: 단순하면서도 강력한 지수 평활 기반 모델.
- **최적 모델 자동 선정 (Verdict AI)**: RMSE, MAPE, MAE 등 다양한 지표를 종합하여 가장 신뢰도 높은 모델을 AI가 자동 추천합니다.

### 3. 고품질 대시보드 (Analytical Dashboard)
- **시각화**: 시계열 그래프, 신뢰구간(CI 80/95), 데이터 분해(Decomposition) 차트 제공.
- **통계 지표**: ACF/PACF 그래프 및 10여 가지의 정밀 평가지표 제공.
- **인사이트 제공**: 모델별 성능 비교 테이블과 최적 모델 선정 근거를 상세히 설명.

### 4. 리포트 및 데이터 내보내기
- **PDF 리포트**: 분석 결과를 한눈에 확인할 수 있는 PDF 리포트 자동 생성.
- **CSV 데이터**: 예측된 미래 데이터를 CSV 형식으로 즉시 다운로드 가능.

---

## 🚀 사용 방법

1. **데이터 준비**: 날짜(`date`, `ds` 등)와 수치 데이터(`value`, `y` 등)가 포함된 단변량 CSV 파일을 준비합니다.
2. **파일 업로드**: 랜딩 페이지의 '시작하기' 버튼을 누른 후, 파일을 드래그 앤 드롭하거나 선택하여 업로드합니다.
3. **분석 수행**: '분석 시작' 버튼을 누르면 서버에서 전처리 및 다중 모델 학습이 자동으로 진행됩니다.
4. **결과 확인**: 대시보드에서 최적의 모델과 예측 결과를 확인하고, 차트와 지표를 통해 심층 분석을 수행합니다.
5. **저장**: 필요한 경우 리포트를 PDF로 저장하거나 예측 데이터를 다운로드합니다.

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS (Premium Dark Mode Design)
- **State Management**: Zustand
- **Visualization**: Recharts, SVG, Canvas API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Library**: statsmodels, pandas, numpy, scikit-learn
- **Stat Tools**: ADF Test, Ljung-Box Test

---

## 📅 프로젝트 로드맵
- [ ] LSTM 및 Transformer 딥러닝 엔진 추가
- [ ] 다변량 시계열(Multivariate) 분석 지원
- [ ] 사용자 커스텀 전처리 옵션 강화
- [ ] 예측 결과 API 연동 기능 제공

---

**ForecastLab**은 데이터 뒤에 숨겨진 미래의 패턴을 가장 쉽고 정확하게 찾아드립니다.
