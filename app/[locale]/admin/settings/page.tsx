import type { Metadata } from "next";
import { Save } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Store Settings | Best Bazar"
};

type ShippingRate = {
  emirate: string;
  cost: number;
  deliveryDays: string;
};

export default async function AdminSettingsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const settings = await prisma.setting.findUniqueOrThrow({
    where: { id: "store-settings" }
  });
  const shippingRates = Array.isArray(settings.shippingRates)
    ? (settings.shippingRates as ShippingRate[])
    : [];
  const settingsData = {
    storeNameEn: settings.storeNameEn,
    storeNameAr: settings.storeNameAr,
    logo: settings.logo ?? "",
    storeEmail: settings.storeEmail,
    phone: settings.phone,
    whatsapp: settings.whatsapp ?? "",
    trn: settings.trn ?? "",
    vatRate: String(settings.vatRate),
    address: settings.address,
    instagram: settings.instagram ?? "",
    facebook: settings.facebook ?? "",
    twitter: settings.twitter ?? "",
    tiktok: settings.tiktok ?? "",
    announcementEn: settings.announcementEn ?? "",
    announcementAr: settings.announcementAr ?? "",
    announcementActive: settings.announcementActive,
    aedToBdt: String(settings.aedToBdt),
    aedToUsd: String(settings.aedToUsd),
    freeShippingThreshold: String(settings.freeShippingThreshold),
    shippingRates: shippingRates.map((rate) => ({
      emirate: rate.emirate,
      cost: String(rate.cost),
      deliveryDays: rate.deliveryDays
    })),
    metaTitleEn: settings.metaTitleEn ?? "",
    metaTitleAr: settings.metaTitleAr ?? "",
    metaDescriptionEn: settings.metaDescriptionEn ?? "",
    metaDescriptionAr: settings.metaDescriptionAr ?? "",
    ogImage: settings.ogImage ?? "",
    googleAnalyticsId: settings.googleAnalyticsId ?? "",
    facebookPixelId: settings.facebookPixelId ?? ""
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.settings}
        title={dictionary.admin.settings}
        subtitle="Configure storefront identity, exchange rates, shipping, social links, SEO, and contact details."
        action={
          <a
            href="#settings-submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            <Save size={17} />
            {dictionary.actions.save}
          </a>
        }
      />

      <AdminSettingsForm locale={locale} settings={settingsData} saveLabel={dictionary.actions.save} />
    </div>
  );
}
