"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
  className?: string;
};

export function BackButton({ label, fallbackHref = "/", className }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? fallbackHref;
  const resolvedLabel = label ?? (currentPathname.startsWith("/ar") ? "\u0631\u062c\u0648\u0639" : "Back");

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={resolvedLabel}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border border-neutral-900 bg-white px-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white",
        className
      )}
    >
      <ArrowLeft size={17} className="rtl:rotate-180" />
      {resolvedLabel}
    </button>
  );
}
