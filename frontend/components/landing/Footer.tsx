"use client";

/**
 * Footer
 * -----------------------------------------------------------
 * Minimal footer. Edit links here only.
 */

export function Footer() {
  return (
    <footer className="mt-24 pb-10 px-6 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-500">
        <div>© {new Date().getFullYear()} Chronos — Time Series Forecasting</div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-ink-900 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-ink-900 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-ink-900 transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
