import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backLabel?: string;
  backHref?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  backLabel,
  backHref = "/"
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <BackButton label={backLabel} fallbackHref={backHref} className="mb-4" />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
