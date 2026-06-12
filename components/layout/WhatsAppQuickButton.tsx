"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type WhatsAppQuickButtonProps = {
  locale: Locale;
  phone?: string;
};

function getWhatsAppHref(phone: string, locale: Locale) {
  const digits = phone.replace(/[^\d]/g, "");
  const message =
    locale === "ar"
      ? "Hello Best Mart, I need support with an order."
      : "Hello Best Mart, I need support or want to place an order.";

  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "";
}

export function WhatsAppQuickButton({ locale, phone }: WhatsAppQuickButtonProps) {
  const href = phone ? getWhatsAppHref(phone, locale) : "";

  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp quick support"
      className="fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-lift transition hover:bg-emerald-700 rtl:left-5 rtl:right-auto"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline">{locale === "ar" ? "WhatsApp" : "WhatsApp order"}</span>
    </Link>
  );
}
