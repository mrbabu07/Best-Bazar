import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeProps = {
  children: ReactNode;
  tone?: "gold" | "green" | "red" | "blue" | "neutral";
  className?: string;
};

const tones = {
  gold: "bg-gold-100 text-gold-800",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  neutral: "bg-neutral-100 text-neutral-700"
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
