import clsx from "clsx";

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "muted";
}

export function Badge({
  tone = "default",
  className,
  children,
  ...rest
}: Props) {
  const tones = {
    default: "bg-white border border-ink-100 text-ink-700",
    accent: "bg-ink-900 text-white",
    muted: "bg-accent-soft text-ink-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-tight",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
