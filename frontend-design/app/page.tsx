"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * ForecastLab — Landing page
 * Pixel-perfect port of design handoff `forecastlab/landing.html`.
 *
 * Strategy:
 *  - Markup is JSX-faithful to the prototype.
 *  - Heavy interactive logic (cursor blob, hero 3D chart, scroll reveals,
 *    word splits, model sparks, overview canvas, tweak panel) is loaded
 *    verbatim from `/forecastlab/landing.js` and `/forecastlab/hero-visuals.js`
 *    via next/script. They mutate the DOM by id/class, which works after
 *    hydration.
 */
export default function LandingPage() {
  useEffect(() => {
    // Original prototype unhides body via `body.loaded` after DOMContentLoaded.
    requestAnimationFrame(() => document.body.classList.add("loaded"));
  }, []);

  return (
    <>
      <div className="cursor-blob" id="cursorBlob" />

      {/* NAV */}
      <nav className="nav" id="nav" data-screen-label="00 Nav">
        <a href="#" className="brand">
          <span className="brand-mark" />
          ForecastLab
        </a>
        <div className="nav-links">
          <a href="#overview">시계열이란</a>
          <a href="#pipeline">예측 프로세스</a>
          <a href="#models">모델 종류</a>
          <a href="#metrics">평가지표</a>
          <a href="/upload" className="start-btn">
            시작하기 →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" data-screen-label="01 Landing Hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eye">TIME-SERIES INTELLIGENCE · v2.6</div>
          <h1>
            <span className="line">
              <span>A Workspace for</span>
            </span>
            <span className="line">
              <span className="grad-text">Time Series Forecasting</span>
            </span>
          </h1>
          <p className="lead">
            시계열 데이터를 업로드하면 예측 결과와 모델별 성능을 한눈에 확인할 수 있습니다.
          </p>
          <div className="hero-cta">
            <a href="/upload" className="btn btn-primary">
              시작하기
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>

        <div className="hero-visual" id="heroVisual">
          <div className="visual-stage" id="visualStage">
            <div className="visual-card" id="heroCard">
              {/* 3D chart svg injected by JS based on variant */}
            </div>
            <div className="floating-card fc-1">
              <div className="fc-label">Forecast · Q3</div>
              <div className="fc-value mono">$ 4.82M</div>
              <div className="fc-trend">▲ 12.4%</div>
            </div>
            <div className="floating-card fc-2">
              <div className="fc-label">Confidence</div>
              <div className="fc-value mono">94.1%</div>
            </div>
            <div className="floating-card fc-3">
              <div className="fc-label">Best model</div>
              <div className="fc-value">Holt-Winter's</div>
            </div>
          </div>
        </div>

        <div className="scroll-hint">SCROLL</div>
      </section>

      {/* 01 OVERVIEW · 시계열이란 */}
      <section className="section" id="overview" data-screen-label="02 What is time-series">
        <div className="what-grid">
          <div className="reveal">
            <div className="section-eye eyebrow">01 · 시계열이란</div>
            <h2>
              시간이 만든 <span className="grad-text">패턴</span>은 미래를 말한다.
            </h2>
            <p className="lead">
              시계열 데이터는 시간 정보와 함께 기록된 데이터로, 시간에 따른 변화와 패턴을 분석하는 것이 핵심입니다.
              <br />
              본 데이터에는 추세, 계절성, 주기성, 불규칙 변동 등이 복합적으로 나타나 있으며, 이를 통해 미래 값을 예측하고 이상 징후를 탐지할 수 있습니다.
            </p>
            <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>TREND</div>
                <div style={{ color: "var(--ink)", fontSize: 14 }}>장기 방향성</div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>SEASONAL</div>
                <div style={{ color: "var(--ink)", fontSize: 14 }}>반복 주기</div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>RESIDUAL</div>
                <div style={{ color: "var(--ink)", fontSize: 14 }}>설명되지 않는 잔차</div>
              </div>
            </div>
          </div>
          <div className="reveal diagram-card" id="overview3d">
            {/* Single stacked decomposition chart — injected by JS */}
          </div>
        </div>
      </section>

      {/* 02 PIPELINE · 예측 프로세스 */}
      <section className="section" id="pipeline" data-screen-label="03 Pipeline">
        <div className="reveal">
          <div className="section-eye eyebrow">02 · 예측 프로세스</div>
          <h2>
            5 단계, <span className="grad-text">완전 자동.</span>
          </h2>
          <p className="lead">
            사용자가 업로드한 CSV 파일을 기반으로 분석, 예측, 의사결정까지의 전 과정을 지원합니다.
          </p>
        </div>

        <div className="pipeline reveal-stagger reveal">
          <div className="pipe-step">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </div>
            <div className="num">01 · COLLECT</div>
            <div className="title">데이터 수집</div>
            <div className="desc">CSV 업로드. </div>
          </div>
          <div className="pipe-step">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
            </div>
            <div className="num">02 · CLEAN</div>
            <div className="title">전처리</div>
            <div className="desc">결측치 보간, 이상치 탐지, 정상성 변환.</div>
          </div>
          <div className="pipe-step">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18" />
              </svg>
            </div>
            <div className="num">03 · LEARN</div>
            <div className="title">패턴 학습</div>
            <div className="desc">ARIMA, Holt-Winter's, Holt's 자동 비교 후 최적 선택.</div>
          </div>
          <div className="pipe-step">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
            </div>
            <div className="num">04 · FORECAST</div>
            <div className="title">예측</div>
            <div className="desc">신뢰구간과 함께 미래 시점 추정.</div>
          </div>
          <div className="pipe-step">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="num">05 · DECIDE</div>
            <div className="title">의사결정</div>
            <div className="desc">리포트 PDF, 예측 CSV 자동 생성.</div>
          </div>
        </div>
      </section>

      {/* 03 MODELS · 모델 종류 */}
      <section className="section" id="models" data-screen-label="04 Models">
        <div className="reveal">
          <div className="section-eye eyebrow">03 · 모델 종류</div>
          <h2>
            4 가지 <span className="grad-text">예측 엔진</span>이 동시에 달립니다.
          </h2>
          <p className="lead">
            통계 기반의 정직한 베이스라인부터 비선형을 다루는 딥러닝까지 — 데이터가 들어오면 모두 동시에 학습되고, 가장 성능이 좋은 모델이 선택됩니다.
          </p>
        </div>
        <div className="models-grid reveal">
          <div className="model-card" data-model="arima">
            <div className="model-spark" data-kind="arima" />
            <div className="model-tag">STATISTICAL</div>
            <h3>ARIMA / SARIMA</h3>
            <p>
              자기회귀(AR) + 차분(I) + 이동평균(MA). 정상성 가정 하에 안정적인 통계적 베이스라인. 계절성을 추가한 SARIMA 까지.
            </p>
            <div className="model-meta">
              <span>· 짧은 시계열에 강함</span>
              <span>· 해석 가능</span>
            </div>
          </div>
          <div className="model-card" data-model="holt_winters">
            <div className="model-spark" data-kind="holt_winters" />
            <div className="model-tag">SMOOTHING</div>
            <h3>Holt-Winter's</h3>
            <p>지수 평활법을 확장하여 추세와 계절성을 모두 반영하는 고전적이고 강력한 통계 모델.</p>
            <div className="model-meta">
              <span>· 계절성 반영</span>
              <span>· 데이터 효율성</span>
            </div>
          </div>
          <div className="model-card" data-model="ets">
            <div className="model-spark" data-kind="ets" />
            <div className="model-tag">SMOOTHING</div>
            <h3>ETS</h3>
            <p>지수평활(Exponential Smoothing). 최근 값에 더 큰 가중치. 짧은 시계열, 부드러운 추세, 곱셈형 계절성에 효과적.</p>
            <div className="model-meta">
              <span>· 빠름</span>
              <span>· 적은 데이터 OK</span>
            </div>
          </div>
          <div className="model-card" data-model="holt">
            <div className="model-spark" data-kind="holt" />
            <div className="model-tag">SMOOTHING</div>
            <h3>Holt's</h3>
            <p>지수 평활법에 추세(Trend) 요소를 추가하여 데이터의 흐름을 효과적으로 추적하는 모델.</p>
            <div className="model-meta">
              <span>· 추세 추종</span>
              <span>· 빠른 연산 속도</span>
            </div>
          </div>
        </div>
      </section>

      {/* 04 METRICS · 평가지표 */}
      <section className="section" id="metrics" data-screen-label="05 Metrics">
        <div className="reveal">
          <div className="section-eye eyebrow">04 · 평가지표</div>
          <h2>
            예측의 <span className="grad-text">진실</span>은 숫자로 검증됩니다.
          </h2>
          <p className="lead">
            하나의 숫자만 믿으면 함정에 빠집니다. ForecastLab은 4가지 지표를 동시에 보여주고, 각 지표가 무엇을 강조하는지 설명합니다.
          </p>
        </div>
        <div className="metrics-grid reveal">
          <div className="metric-card">
            <div className="metric-formula">
              <span className="formula-text">|y − ŷ| / y</span>
              <span className="formula-sub">× 100 / n</span>
            </div>
            <div className="metric-name">MAPE</div>
            <div className="metric-full">Mean Absolute Percentage Error</div>
            <p>퍼센트 단위라 직관적. 단, 실제값이 0 근처면 폭발하는 약점이 있습니다.</p>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ ["--w" as string]: "78%", ["--c" as string]: "var(--grad-1)" } as React.CSSProperties}
              />
            </div>
            <div className="metric-meta">
              <span>직관성</span>
              <span className="mono">★★★★☆</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-formula">
              <span className="formula-text">√Σ(y − ŷ)²</span>
              <span className="formula-sub">/ n</span>
            </div>
            <div className="metric-name">RMSE</div>
            <div className="metric-full">Root Mean Squared Error</div>
            <p>큰 오차에 패널티가 큽니다. 원본 데이터와 단위가 같아 비교가 쉽습니다.</p>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ ["--w" as string]: "92%", ["--c" as string]: "var(--grad-2)" } as React.CSSProperties}
              />
            </div>
            <div className="metric-meta">
              <span>이상치 민감</span>
              <span className="mono">★★★★★</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-formula">
              <span className="formula-text">Σ|y − ŷ|</span>
              <span className="formula-sub">/ n</span>
            </div>
            <div className="metric-name">MAE</div>
            <div className="metric-full">Mean Absolute Error</div>
            <p>이상치에 강건. 모든 오차를 동등하게 취급하므로 robust한 평가가 필요할 때.</p>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ ["--w" as string]: "65%", ["--c" as string]: "var(--grad-3)" } as React.CSSProperties}
              />
            </div>
            <div className="metric-meta">
              <span>강건성</span>
              <span className="mono">★★★★★</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-formula">
              <span className="formula-text">−2 ln L</span>
              <span className="formula-sub">+ 2k</span>
            </div>
            <div className="metric-name">AIC / BIC</div>
            <div className="metric-full">Information Criterion</div>
            <p>모델의 복잡도(파라미터 수)를 패널티로 부과. 과적합을 막는 모델 선택 기준.</p>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ ["--w" as string]: "84%", ["--c" as string]: "var(--grad-1)" } as React.CSSProperties}
              />
            </div>
            <div className="metric-meta">
              <span>모델 선택</span>
              <span className="mono">★★★★☆</span>
            </div>
          </div>
        </div>

        <div className="cta-block reveal" data-screen-label="06 CTA">
          <div className="eyebrow" style={{ marginBottom: 16 }}>READY?</div>
          <h2 className="h-display">
            지금 <span className="grad-text">8초</span> 안에 첫 예측을.
          </h2>
          <p>CSV를 끌어다 놓으면 됩니다. 설정도, 코드도 필요 없습니다.</p>
          <a href="/upload" className="btn btn-primary">
            CSV 업로드 →
          </a>
        </div>
      </section>

      <footer className="footer">
        <div>FORECASTLAB · 2026</div>
        <div>v 2.6.1 · BUILD 4421</div>
      </footer>

      {/* TWEAKS PANEL — only visible inside Claude design editor */}
      <aside className="tweaks" id="tweaks">
        <h3>Tweaks</h3>
        <label>Color gradient</label>
        <div className="swatch-row" id="swatchRow" />
        <label>Hero visual</label>
        <div className="tweak-radio" id="visualRow">
          <button data-v="line">3D Line · 회전</button>
          <button data-v="wave">Flowing wave · 마우스 일렁임</button>
          <button data-v="band">Forecast band · 살아있는 신뢰구간</button>
          <button data-v="particle">Particle field · 시간의 흐름</button>
        </div>
      </aside>

      {/* Animation runtime — order matters: hero-visuals defines window.HERO_VISUALS,
          landing.js consumes it. */}
      <Script src="/forecastlab/hero-visuals.js" strategy="afterInteractive" />
      <Script src="/forecastlab/landing.js" strategy="afterInteractive" />
    </>
  );
}
