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
  const resolvedLabel = label ?? (pathname.startsWith("/ar") ? "رجوع" : "Back");

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
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 bg-white px-3 text-sm font-bold text-navy transition hover:bg-gold-50",
        className
      )}
    >
      <ArrowLeft size={17} className="rtl:rotate-180" />
      {resolvedLabel}
    </button>
  );
}
