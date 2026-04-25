"use client";

/**
 * Landing Header
 * -----------------------------------------------------------
 * Keep all header-only concerns here: logo, nav, top-right CTA.
 * Copy, layout, and styling can be edited without touching the
 * Hero or FileUploadBox components.
 */

import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="w-full px-6 md:px-10 pt-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">
            Chronos
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-500">
          <a href="#features" className="hover:text-ink-900 transition-colors">
            Features
          </a>
          <a href="#models" className="hover:text-ink-900 transition-colors">
            Models
          </a>
          <a href="#docs" className="hover:text-ink-900 transition-colors">
            Docs
          </a>
        </nav>

        <Button size="sm" variant="primary">
          Get started
        </Button>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="9.5"
        stroke="#0B0B0D"
        strokeWidth="1.2"
        fill="white"
      />
      <path
        d="M3 13.2 C 6 9, 8 14, 11 10.5 S 16 6.5, 19 9"
        stroke="#0B0B0D"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
