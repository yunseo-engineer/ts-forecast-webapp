"use client";

/**
 * Hero
 * -----------------------------------------------------------
 * Large centered headline + subtext.
 * Edit headline/subtext here without touching the file upload logic.
 */

export function Hero() {
  return (
    <div className="text-center animate-fade-up">
      <h1
        className="font-display text-[56px] md:text-[88px] leading-[0.98] tracking-[-0.03em] text-ink-900"
        style={{ fontWeight: 400 }}
      >
        A Workspace for 
        <br />
        Time Series Forecasting
      </h1>

      <p className="mt-6 text-base md:text-lg text-ink-500 max-w-xl mx-auto tracking-tight">
        시계열 데이터를 업로드 하면 예측 결과와 모델별 성능을 확인할 수 있습니다. 
        
      </p>
    </div>
  );
}
