import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type AdminMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "gold" | "green" | "red" | "blue";
};

const tones = {
  gold: "bg-gold-100 text-gold-800",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700"
};

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "gold"
}: AdminMetricCardProps) {
  return (
    <article className="flex min-h-[148px] rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 truncate text-3xl font-bold text-navy">{value}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">{detail}</p>
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-md", tones[tone])}>
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}
