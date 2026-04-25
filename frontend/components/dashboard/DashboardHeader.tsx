"use client";

/**
 * DashboardHeader
 * -----------------------------------------------------------
 * Sticky top bar for the dashboard. Edit brand/actions here only.
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-ink-100 text-ink-500 group-hover:text-ink-900 transition-colors">
            ←
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">
            Chronos
          </span>
          <span className="text-xs text-ink-500">/ Dashboard</span>
        </Link>

        <Button variant="outline" size="sm" onClick={() => history.back()}>
          새 파일 업로드
        </Button>
      </div>
    </header>
  );
}
