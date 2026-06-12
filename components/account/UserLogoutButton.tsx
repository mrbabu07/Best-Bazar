"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Locale } from "@/lib/i18n";

type UserLogoutButtonProps = {
  locale: Locale;
};

export function UserLogoutButton({ locale }: UserLogoutButtonProps) {
  const label = locale === "ar" ? "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c" : "Logout";

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
    >
      <LogOut size={16} />
      {label}
    </button>
  );
}
