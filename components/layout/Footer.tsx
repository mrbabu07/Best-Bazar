import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Music2, Phone } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { StorefrontFrameSettings } from "@/components/layout/AppFrame";

type FooterProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};

export function Footer({ locale, dictionary, settings }: FooterProps) {
  const brandName = locale === "ar" ? settings.storeNameAr : settings.storeNameEn;

  return (
    <footer className="border-t border-gold-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href={`/${locale}`} className="croissant-one-regular text-2xl text-navy">
            {brandName || dictionary.brand}
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">
            {dictionary.footer.tagline}
          </p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-gold-700">
            {locale === "ar" ? "تابعنا" : "Follow us"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-navy">
            {settings.instagram ? (
              <Link
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 hover:bg-gold-50"
              >
                <Instagram size={18} />
              </Link>
            ) : null}
            {settings.facebook ? (
              <Link
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 hover:bg-gold-50"
              >
                <Facebook size={18} />
              </Link>
            ) : null}
            {settings.tiktok ? (
              <Link
                href={settings.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                title="TikTok"
                className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 hover:bg-gold-50"
              >
                <Music2 size={18} />
              </Link>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.nav.shop}
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-neutral-600">
            <Link href={`/${locale}/shop`} className="hover:text-navy">
              {dictionary.common.featured}
            </Link>
            <Link href={`/${locale}/shop?tag=new`} className="hover:text-navy">
              {dictionary.common.newArrivals}
            </Link>
            <Link href={`/${locale}/cart`} className="hover:text-navy">
              {dictionary.nav.cart}
            </Link>
            <Link href={`/${locale}/track-order`} className="hover:text-navy">
              {locale === "ar" ? "تتبع الطلب" : "Track order"}
            </Link>
            <Link href={`/${locale}/privacy`} className="hover:text-navy">
              {locale === "ar" ? "سياسة الخصوصية" : "Privacy policy"}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-navy">
              {locale === "ar" ? "الشروط" : "Terms"}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.footer.contact}
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-neutral-600">
            {settings.address ? (
              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {settings.address}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <Phone size={16} />
              {settings.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} />
              {settings.email}
            </p>
            {settings.whatsapp ? (
              <Link
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-navy"
              >
                <MessageCircle size={16} />
                {locale === "ar" ? "دعم واتساب" : "WhatsApp support"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
