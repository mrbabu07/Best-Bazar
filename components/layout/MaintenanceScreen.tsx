import { Clock, Mail, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { StorefrontFrameSettings } from "@/components/layout/types";

type MaintenanceScreenProps = {
  locale: Locale;
  settings: StorefrontFrameSettings;
};

export function MaintenanceScreen({ locale, settings }: MaintenanceScreenProps) {
  const title =
    locale === "ar" ? settings.themeSettings.maintenanceTitleAr : settings.themeSettings.maintenanceTitleEn;
  const message =
    locale === "ar" ? settings.themeSettings.maintenanceMessageAr : settings.themeSettings.maintenanceMessageEn;
  const brand = locale === "ar" ? settings.storeNameAr : settings.storeNameEn;
  const whatsappHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`
    : "";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12">
      <section className="w-full max-w-2xl rounded-xl border border-gold-100 bg-white p-6 text-center shadow-lift sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gold-50 text-gold-700">
          <Clock size={26} />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-gold-700">{brand}</p>
        <h1 className="mt-3 text-3xl font-black text-navy sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-neutral-600 sm:text-base">
          {message}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-bold text-white shadow-soft hover:bg-emerald-700"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          ) : null}
          {settings.email ? (
            <a
              href={`mailto:${settings.email}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-200 px-5 text-sm font-bold text-navy hover:bg-paper"
            >
              <Mail size={17} />
              {settings.email}
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
