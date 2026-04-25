"use client";

/**
 * FeatureHighlights
 * -----------------------------------------------------------
 * The row of small badges below the CTA (mirrors "4% Cash back | 150+ Countries"
 * strip from the reference design). Edit items[] to change the copy.
 */

const items = [
  { label: "자동 전처리" },
  { label: "5개 예측 모델" },
  { label: "10종 평가 지표" },
];

export function FeatureHighlights() {
  return (
    <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-700 animate-fade-up [animation-delay:240ms]">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <CheckIcon /> {it.label}
          </span>
          {i < items.length - 1 && (
            <span className="text-ink-300 select-none">|</span>
          )}
        </div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-emerald-600 text-white">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 5.2 4 7.2 8 3.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
