"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type WhatsAppQuickButtonProps = {
  locale: Locale;
  phone?: string;
};

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[30px] w-[30px] fill-current"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.892 9.891-9.892 2.641.001 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.895 6.993c-.003 5.45-4.437 9.892-9.89 9.892m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.688 1.448h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 0 0-3.488-8.413Z" />
    </svg>
  );
}

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
      title="WhatsApp"
      className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition duration-200 hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E] focus-visible:ring-offset-2 sm:bottom-5 sm:right-5 sm:z-50 rtl:left-4 rtl:right-auto sm:rtl:left-5"
    >
      <WhatsAppIcon />
    </Link>
  );
}
