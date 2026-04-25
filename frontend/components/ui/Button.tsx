"use client";

import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight " +
  "transition-all duration-150 ease-out select-none disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-white hover:bg-black active:translate-y-px",
  ghost: "bg-transparent text-ink-900 hover:bg-accent-soft",
  outline:
    "bg-white text-ink-900 border border-ink-100 hover:border-ink-500 hover:bg-accent-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});
