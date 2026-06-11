"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type NotFoundBackButtonProps = {
  label: string;
};

export function NotFoundBackButton({ label }: NotFoundBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gold-200 bg-white px-5 text-sm font-bold text-navy transition hover:bg-gold-50"
    >
      <ArrowLeft size={17} />
      {label}
    </button>
  );
}
