import type { Metadata } from "next";
import { ImagePlus, Link2, Save } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { settings } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { formatCurrency } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Store Settings | Best Bazar"
};

export default function AdminSettingsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.settings}
        title={dictionary.admin.settings}
        subtitle="Configure storefront identity, exchange rates, shipping, banners, social links, and contact details."
        action={
          <Button>
            <Save size={17} />
            {dictionary.actions.save}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Store identity</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Store name EN
              <input defaultValue={settings.storeName.en} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Store name AR
              <input defaultValue={settings.storeName.ar} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
            </label>
            <button
              type="button"
              className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy sm:col-span-2"
            >
              <ImagePlus size={18} />
              Logo upload
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Currency rates</h2>
          <div className="mt-5 grid gap-4">
            {[
              ["AED to BDT", "33.5"],
              ["AED to USD", "0.272"]
            ].map(([label, value]) => (
              <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                {label}
                <input defaultValue={value} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
              </label>
            ))}
            <p className="text-sm text-neutral-500">
              Base order values remain in AED. Preview: {formatCurrency(100, "BDT", locale)} / {formatCurrency(100, "USD", locale)}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Shipping rates</h2>
          <div className="mt-5 grid gap-3">
            {settings.shippingRates.map((rate) => (
              <div key={rate.emirate} className="grid gap-3 rounded-md bg-paper p-3 sm:grid-cols-3">
                <input defaultValue={rate.emirate} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                <input defaultValue={rate.price} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                <input defaultValue={rate.freeAbove} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Contact and social</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Phone
              <input defaultValue={settings.contactInfo.phone} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Email
              <input defaultValue={settings.contactInfo.email} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Address
              <input defaultValue={settings.contactInfo.address} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
            </label>
            {["Instagram", "Facebook", "TikTok"].map((social) => (
              <label key={social} className="grid gap-2 text-sm font-semibold text-navy">
                {social}
                <div className="relative">
                  <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
                  <input className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-9 pr-3 text-sm rtl:pl-3 rtl:pr-9" />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
          <h2 className="text-lg font-bold text-navy">Hero banners</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {settings.banners.map((banner) => (
              <div key={banner.link} className="rounded-lg border border-neutral-200 bg-paper p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input defaultValue={banner.title.en} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                  <input defaultValue={banner.title.ar} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                  <input defaultValue={banner.link} className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm sm:col-span-2" />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy"
            >
              <ImagePlus size={18} />
              Add banner
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
