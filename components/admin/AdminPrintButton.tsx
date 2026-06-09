"use client";

import { Printer } from "lucide-react";

type AdminPrintButtonProps = {
  label: string;
};

export function AdminPrintButton({ label }: AdminPrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
      aria-label={label}
    >
      <Printer size={18} />
    </button>
  );
}
