import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";

type FooterProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function Footer({ locale, dictionary }: FooterProps) {
  return (
    <footer className="border-t border-gold-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href={`/${locale}`} className="text-2xl font-bold text-navy">
            {dictionary.brand}
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">
            {dictionary.footer.tagline}
          </p>
          <div className="mt-5 flex gap-3 text-navy">
            <Link
              href="#"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 hover:bg-gold-50"
            >
              <Instagram size={18} />
            </Link>
            <Link
              href="#"
              aria-label="Facebook"
              className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 hover:bg-gold-50"
            >
              <Facebook size={18} />
            </Link>
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
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.footer.contact}
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-neutral-600">
            <p className="flex items-center gap-2">
              <MapPin size={16} />
              Business Bay, Dubai
            </p>
            <p className="flex items-center gap-2">
              <Phone size={16} />
              +971 4 555 0198
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} />
              support@bestbazar.ae
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
