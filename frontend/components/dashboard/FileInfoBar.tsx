"use client";

/**
 * FileInfoBar
 * -----------------------------------------------------------
 * Makes clear which file is currently powering the dashboard
 * — addresses "현재 어떤 파일을 기준으로 분석 중인지" requirement (2.2).
 */

import type { DatasetInfo } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function FileInfoBar({ dataset }: { dataset: DatasetInfo }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500">
      <Badge tone="accent">
        <DocIcon />
        {dataset.filename}
      </Badge>
      <span className="text-ink-300">·</span>
      <span>
        <span className="text-ink-900 font-medium">{dataset.rows}</span> rows
      </span>
      <span className="text-ink-300">·</span>
      <span>
        {dataset.start} → {dataset.end}
      </span>
      {dataset.frequency && (
        <>
          <span className="text-ink-300">·</span>
          <span>freq: {dataset.frequency}</span>
        </>
      )}
      <span className="text-ink-300">·</span>
      <Badge tone="muted">자동 전처리 완료</Badge>
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2 1h4l2 2v6H2z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
