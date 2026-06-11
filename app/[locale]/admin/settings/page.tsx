import type { Metadata } from "next";
import { Save } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getDictionary, isLocale } from "@/lib/i18n";
import { normalizePaymentSettings } from "@/lib/payment-config";
import { prisma } from "@/lib/prisma";
import { normalizeThemeSettings } from "@/lib/theme-config";
import { normalizeShippingSettings } from "@/utils/shipping";

export const metadata: Metadata = {
  title: "Store Settings | Best Bazar"
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
  const shippingSettings = normalizeShippingSettings(settings);
  const paymentSettings = normalizePaymentSettings(settings.paymentSettings);
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
    paymentSettings,
    themeSettings: normalizeThemeSettings(settings.themeSettings),
    shippingRates: shippingSettings.shippingRates.map((rate) => ({
      key: rate.key,
      nameEn: rate.nameEn,
      nameAr: rate.nameAr,
      cost: String(rate.cost),
      freeFrom: String(rate.freeFrom),
      deliveryDays: rate.deliveryDays,
      codAvailable: rate.codAvailable
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
        subtitle="Configure storefront identity, payments, UI theme, exchange rates, shipping, social links, SEO, and contact details."
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
