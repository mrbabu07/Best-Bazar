"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useFavouriteStore } from "@/store/favourite-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { Button } from "@/components/ui/Button";

type FavouritesPageContentProps = {
  locale: Locale;
};

export function FavouritesPageContent({ locale }: FavouritesPageContentProps) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const hydrated = useHydrated();
  const items = useFavouriteStore((state) => state.items);
  const remove = useFavouriteStore((state) => state.remove);
  const currency = usePreferencesStore((state) => state.currency);
  const currencyRates = usePreferencesStore((state) => state.currencyRates) ?? defaultCurrencyRates;
  const visibleItems = hydrated ? items : [];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-gold-100 text-gold-800">
          <Heart size={21} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">{t("Saved products", "المنتجات المحفوظة")}</p>
          <h1 className="text-3xl font-bold text-navy">{t("Favourites", "المفضلة")}</h1>
        </div>
      </div>

      {!visibleItems.length ? (
        <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-soft">
          <h2 className="text-xl font-bold text-navy">{t("No favourites yet", "لا توجد منتجات مفضلة بعد")}</h2>
          <p className="mt-2 text-sm font-semibold text-neutral-500">{t("Save products you want to check again later.", "احفظ المنتجات التي ترغب في مشاهدتها لاحقاً.")}</p>
          <Link
            href={`/${locale}/shop`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-navy px-5 text-sm font-bold text-white"
          >
            {t("Continue shopping", "متابعة التسوق")}
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
              <Link href={`/${locale}/product/${item.slug}`} className="relative block aspect-square bg-neutral-100">
                <Image src={item.image} alt={getLocalized(item.name, locale)} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </Link>
              <div className="grid gap-3 p-3">
                <Link href={`/${locale}/product/${item.slug}`} className="line-clamp-2 min-h-10 text-sm font-bold text-navy">
                  {getLocalized(item.name, locale)}
                </Link>
                <p className="text-sm font-black text-navy">{formatCurrency(item.price, currency, locale, currencyRates)}</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => remove(item.id)}>
                  <Trash2 size={15} />
                  {t("Remove", "إزالة")}
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
