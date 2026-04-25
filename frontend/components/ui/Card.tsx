import clsx from "clsx";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  action,
  className,
  children,
  ...rest
}: Props) {
  return (
    <section
      className={clsx(
        "bg-white border border-ink-100 rounded-2xl shadow-soft",
        className
      )}
      {...rest}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-ink-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}
