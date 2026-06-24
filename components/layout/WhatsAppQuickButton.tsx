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
      className="fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:bg-[#1fbd59] sm:bottom-5 sm:z-50 rtl:left-5 rtl:right-auto"
    >
      <MessageCircle size={27} strokeWidth={2.4} />
    </Link>
  );
}
