import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-extrabold text-navy sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-3 text-sm font-medium leading-6 text-neutral-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
