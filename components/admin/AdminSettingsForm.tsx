"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, normalizeCurrencyRates } from "@/utils/currency";

type ShippingRate = {
  emirate: string;
  cost: string;
  deliveryDays: string;
};

export type AdminSettingsData = {
  storeNameEn: string;
  storeNameAr: string;
  logo: string;
  storeEmail: string;
  phone: string;
  whatsapp: string;
  trn: string;
  vatRate: string;
  address: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  aedToBdt: string;
  aedToUsd: string;
  freeShippingThreshold: string;
  shippingRates: ShippingRate[];
  metaTitleEn: string;
  metaTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  ogImage: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
};

type AdminSettingsFormProps = {
  locale: Locale;
  settings: AdminSettingsData;
  saveLabel: string;
};

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function AdminSettingsForm({ locale, settings, saveLabel }: AdminSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const previewRates = normalizeCurrencyRates({
    AED: 1,
    BDT: form.aedToBdt,
    USD: form.aedToUsd
  });

  const updateForm = <Key extends keyof AdminSettingsData>(key: Key, value: AdminSettingsData[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateRate = (index: number, key: keyof ShippingRate, value: string) => {
    setForm((current) => ({
      ...current,
      shippingRates: current.shippingRates.map((rate, rateIndex) =>
        rateIndex === index ? { ...rate, [key]: value } : rate
      )
    }));
  };

  const addRate = () => {
    setForm((current) => ({
      ...current,
      shippingRates: [...current.shippingRates, { emirate: "", cost: "0", deliveryDays: "1-2 days" }]
    }));
  };

  const removeRate = (index: number) => {
    setForm((current) => ({
      ...current,
      shippingRates: current.shippingRates.filter((_, rateIndex) => rateIndex !== index)
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      storeNameEn: form.storeNameEn,
      storeNameAr: form.storeNameAr,
      logo: nullable(form.logo),
      storeEmail: form.storeEmail,
      phone: form.phone,
      whatsapp: nullable(form.whatsapp),
      trn: nullable(form.trn),
      vatRate: Number(form.vatRate),
      address: form.address,
      instagram: nullable(form.instagram),
      facebook: nullable(form.facebook),
      twitter: nullable(form.twitter),
      tiktok: nullable(form.tiktok),
      announcementEn: nullable(form.announcementEn),
      announcementAr: nullable(form.announcementAr),
      announcementActive: form.announcementActive,
      aedToBdt: Number(form.aedToBdt),
      aedToUsd: Number(form.aedToUsd),
      freeShippingThreshold: Number(form.freeShippingThreshold),
      shippingRates: form.shippingRates.map((rate) => ({
        emirate: rate.emirate,
        cost: Number(rate.cost),
        deliveryDays: rate.deliveryDays
      })),
      metaTitleEn: nullable(form.metaTitleEn),
      metaTitleAr: nullable(form.metaTitleAr),
      metaDescriptionEn: nullable(form.metaDescriptionEn),
      metaDescriptionAr: nullable(form.metaDescriptionAr),
      ogImage: nullable(form.ogImage),
      googleAnalyticsId: nullable(form.googleAnalyticsId),
      facebookPixelId: nullable(form.facebookPixelId)
    };

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save settings.");
      }

      toast.success("Settings saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-navy">Store identity</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Store name EN
            <input
              value={form.storeNameEn}
              onChange={(event) => updateForm("storeNameEn", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Store name AR
            <input
              value={form.storeNameAr}
              onChange={(event) => updateForm("storeNameAr", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <AdminImageUploadField
              label="Logo"
              value={form.logo}
              onChange={(value) => updateForm("logo", value)}
              previewAlt={form.storeNameEn}
              aspectClassName="aspect-[5/2]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy sm:col-span-2">
            <input
              type="checkbox"
              checked={form.announcementActive}
              onChange={(event) => updateForm("announcementActive", event.target.checked)}
              className="accent-gold-500"
            />
            Announcement active
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Announcement EN
            <input
              value={form.announcementEn}
              onChange={(event) => updateForm("announcementEn", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Announcement AR
            <input
              value={form.announcementAr}
              onChange={(event) => updateForm("announcementAr", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-navy">Currency and shipping</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            AED to BDT
            <input
              type="number"
              min="0"
              step="0.0001"
              value={form.aedToBdt}
              onChange={(event) => updateForm("aedToBdt", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            AED to USD
            <input
              type="number"
              min="0"
              step="0.0001"
              value={form.aedToUsd}
              onChange={(event) => updateForm("aedToUsd", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Free shipping threshold
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.freeShippingThreshold}
              onChange={(event) => updateForm("freeShippingThreshold", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <div className="grid gap-4 rounded-md border border-gold-100 bg-gold-50 p-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              VAT rate %
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.vatRate}
                onChange={(event) => updateForm("vatRate", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              TRN
              <input
                value={form.trn}
                onChange={(event) => updateForm("trn", event.target.value)}
                placeholder="VAT registration number"
                className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              />
            </label>
            <p className="text-xs font-semibold leading-5 text-neutral-600 sm:col-span-2">
              VAT is shown as included on invoices when the rate is greater than 0. Set the rate to 0 if the business is not VAT registered.
            </p>
          </div>
          <p className="text-sm text-neutral-500">
            Preview: {formatCurrency(100, "BDT", locale, previewRates)} / {formatCurrency(100, "USD", locale, previewRates)}
          </p>
          <div className="grid gap-3">
            {form.shippingRates.map((rate, index) => (
              <div key={`${rate.emirate}-${index}`} className="grid gap-3 rounded-md bg-paper p-3 sm:grid-cols-[1fr_100px_1fr_auto]">
                <input
                  value={rate.emirate}
                  onChange={(event) => updateRate(index, "emirate", event.target.value)}
                  placeholder="Emirate"
                  required
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate.cost}
                  onChange={(event) => updateRate(index, "cost", event.target.value)}
                  placeholder="Cost"
                  required
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
                <input
                  value={rate.deliveryDays}
                  onChange={(event) => updateRate(index, "deliveryDays", event.target.value)}
                  placeholder="Delivery"
                  required
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRate(index)}
                  className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                  aria-label="Remove shipping rate"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addRate}>
            <Plus size={16} />
            Add rate
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-navy">Contact and social</h2>
        <div className="mt-5 grid gap-4">
          {[
            ["phone", "Phone", true],
            ["storeEmail", "Email", true],
            ["whatsapp", "WhatsApp", false],
            ["address", "Address", true],
            ["instagram", "Instagram", false],
            ["facebook", "Facebook", false],
            ["twitter", "Twitter", false],
            ["tiktok", "TikTok", false]
          ].map(([key, label, required]) => (
            <label key={key as string} className="grid gap-2 text-sm font-semibold text-navy">
              {label}
              <input
                value={form[key as keyof AdminSettingsData] as string}
                onChange={(event) => updateForm(key as keyof AdminSettingsData, event.target.value as never)}
                required={Boolean(required)}
                type={key === "storeEmail" ? "email" : "text"}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-navy">SEO and tracking</h2>
        <div className="mt-5 grid gap-4">
          {[
            ["metaTitleEn", "Meta title EN"],
            ["metaTitleAr", "Meta title AR"],
            ["googleAnalyticsId", "Google Analytics ID"],
            ["facebookPixelId", "Facebook Pixel ID"]
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
              {label}
              <input
                value={form[key as keyof AdminSettingsData] as string}
                onChange={(event) => updateForm(key as keyof AdminSettingsData, event.target.value as never)}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Meta description EN
            <textarea
              rows={3}
              value={form.metaDescriptionEn}
              onChange={(event) => updateForm("metaDescriptionEn", event.target.value)}
              className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Meta description AR
            <textarea
              rows={3}
              value={form.metaDescriptionAr}
              onChange={(event) => updateForm("metaDescriptionAr", event.target.value)}
              className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
            />
          </label>
          <AdminImageUploadField
            label="OG image"
            value={form.ogImage}
            onChange={(value) => updateForm("ogImage", value)}
            previewAlt="Open graph image"
            aspectClassName="aspect-[16/9]"
          />
        </div>
      </section>

      <div id="settings-submit" className="xl:col-span-2">
        <Button type="submit" size="lg" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </form>
  );
}
