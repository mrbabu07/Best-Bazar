import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 text-left rtl:text-right">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-[2rem] font-normal leading-tight tracking-[0.01em] text-neutral-950 sm:text-[3.35rem]">{title}</h2>
        {subtitle ? <p className="mt-3 text-sm font-medium leading-6 text-neutral-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
