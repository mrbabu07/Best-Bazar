"use client";

import { Printer } from "lucide-react";

type AdminPrintButtonProps = {
  label: string;
};

export function AdminPrintButton({ label }: AdminPrintButtonProps) {
  const printTarget = () => {
    document.body.classList.add("admin-printing");

    const cleanup = () => {
      document.body.classList.remove("admin-printing");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 500);
    }, 50);
  };

  return (
    <button
      type="button"
      onClick={printTarget}
      className="admin-print-hide grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
      aria-label={label}
    >
      <Printer size={18} />
    </button>
  );
}
