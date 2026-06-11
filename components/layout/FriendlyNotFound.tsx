import Link from "next/link";
import { Home, Search } from "lucide-react";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { NotFoundBackButton } from "@/components/layout/NotFoundBackButton";

type FriendlyNotFoundProps = {
  locale?: Locale;
};

export function FriendlyNotFound({ locale = defaultLocale }: FriendlyNotFoundProps) {
  const homeHref = `/${locale}`;
  const shopHref = `/${locale}/shop`;
  const isArabic = locale === "ar";

  return (
    <main className="grid min-h-[70vh] place-items-center bg-paper px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full max-w-2xl rounded-lg border border-gold-100 bg-white p-6 text-center shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">404</p>
        <h1 className="mt-3 text-3xl font-bold text-navy sm:text-5xl">
          {isArabic ? "الصفحة غير موجودة" : "Page not found"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
          {isArabic
            ? "الرابط الذي فتحته غير صحيح أو تم نقل الصفحة. يمكنك الرجوع للصفحة السابقة أو الذهاب للمتجر."
            : "This page link is missing or has moved. You can go back to the previous page, open home, or continue shopping."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <NotFoundBackButton label={isArabic ? "رجوع" : "Back"} />
          <Link
            href={homeHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-bold text-navy transition hover:from-gold-400 hover:to-gold-200"
          >
            <Home size={17} />
            {isArabic ? "الرئيسية" : "Home"}
          </Link>
          <Link
            href={shopHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-navy px-5 text-sm font-bold text-white transition hover:bg-navy-light"
          >
            <Search size={17} />
            {isArabic ? "المتجر" : "Shop"}
          </Link>
        </div>
      </section>
    </main>
  );
}
