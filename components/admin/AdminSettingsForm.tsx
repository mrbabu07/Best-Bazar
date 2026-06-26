"use client";

import { HandCoins, Save, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { Button } from "@/components/ui/Button";
import { courierProviderOptions, type CourierSettings } from "@/lib/courier-config";
import type { Locale } from "@/lib/i18n";
import type { PaymentSettings } from "@/lib/payment-config";
import { safeResponseJson } from "@/lib/safe-json";
import type { ThemeSettings } from "@/lib/theme-config";
import { formatCurrency, normalizeCurrencyRates } from "@/utils/currency";
import { shippingRatesToRecord, type CustomAreaFee } from "@/utils/shipping";

type ShippingRate = {
  key: string;
  nameEn: string;
  nameAr: string;
  cost: string;
  freeFrom: string;
  deliveryDays: string;
  codAvailable: boolean;
};

type CustomAreaFeeForm = Omit<CustomAreaFee, "fee"> & { fee: string };

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
  customAreaFee: CustomAreaFeeForm;
  courierSettings: CourierSettings;
  paymentSettings: PaymentSettings;
  themeSettings: ThemeSettings;
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

  const updateCustomAreaFee = <Key extends keyof CustomAreaFeeForm>(key: Key, value: CustomAreaFeeForm[Key]) => {
    setForm((current) => ({
      ...current,
      customAreaFee: { ...current.customAreaFee, [key]: value }
    }));
  };

  const updatePayment = <
    Method extends keyof PaymentSettings,
    Key extends keyof PaymentSettings[Method]
  >(
    method: Method,
    key: Key,
    value: PaymentSettings[Method][Key]
  ) => {
    setForm((current) => ({
      ...current,
      paymentSettings: {
        ...current.paymentSettings,
        [method]: {
          ...current.paymentSettings[method],
          [key]: value
        }
      }
    }));
  };

  const updateCodAvailabilityMode = (mode: PaymentSettings["cod"]["availabilityMode"]) => {
    setForm((current) => ({
      ...current,
      paymentSettings: {
        ...current.paymentSettings,
        cod: {
          ...current.paymentSettings.cod,
          enabled: true,
          availabilityMode: mode
        }
      }
    }));
  };

  const updateCourier = <Key extends keyof CourierSettings>(key: Key, value: CourierSettings[Key]) => {
    setForm((current) => ({
      ...current,
      courierSettings: {
        ...current.courierSettings,
        [key]: value
      }
    }));
  };

  const paymentStatusCards = [
    {
      key: "cod" as const,
      label: "Cash on delivery",
      detail: "Default checkout payment method",
      icon: HandCoins,
      configured: true
    }
  ];

  const updateTheme = <Key extends keyof ThemeSettings>(key: Key, value: ThemeSettings[Key]) => {
    setForm((current) => ({
      ...current,
      themeSettings: {
        ...current.themeSettings,
        [key]: value
      }
    }));
  };

  const updateCheckoutControl = <Key extends keyof ThemeSettings["checkoutControls"]>(
    key: Key,
    value: ThemeSettings["checkoutControls"][Key]
  ) => {
    setForm((current) => ({
      ...current,
      themeSettings: {
        ...current.themeSettings,
        checkoutControls: {
          ...current.themeSettings.checkoutControls,
          [key]: value
        }
      }
    }));
  };

  const updateStorefrontContent = <Key extends keyof ThemeSettings["storefrontContent"]>(
    key: Key,
    value: ThemeSettings["storefrontContent"][Key]
  ) => {
    setForm((current) => ({
      ...current,
      themeSettings: {
        ...current.themeSettings,
        storefrontContent: { ...current.themeSettings.storefrontContent, [key]: value }
      }
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
      courierSettings: form.courierSettings,
      paymentSettings: {
        ...form.paymentSettings,
        cod: {
          ...form.paymentSettings.cod,
          enabled: true,
          instructions: ""
        },
        stripe: {
          ...form.paymentSettings.stripe,
          enabled: false
        }
      },
      themeSettings: form.themeSettings,
      shippingRates: shippingRatesToRecord([], {
        ...form.customAreaFee,
        enabled: true,
        codAvailable: true,
        fee: Number(form.customAreaFee.fee)
      }),
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
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save settings.");
      }

      toast.success("Settings saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const SectionSaveButton = ({ label = "Save this section" }: { label?: string }) => (
    <Button type="submit" variant="secondary" size="sm" disabled={saving}>
      <Save size={16} />
      {saving ? "Saving..." : label}
    </Button>
  );

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-bold text-navy">Storefront copy</h2><p className="mt-1 text-sm text-neutral-500">Navigation, footer, and legal-page text shown to customers.</p></div>
          <SectionSaveButton />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["navHomeEn", "Navigation home EN"], ["navHomeAr", "Navigation home AR"],
            ["navShopEn", "Navigation shop EN"], ["navShopAr", "Navigation shop AR"],
            ["navAccountEn", "Navigation account EN"], ["navAccountAr", "Navigation account AR"],
            ["footerTaglineEn", "Footer tagline EN"], ["footerTaglineAr", "Footer tagline AR"],
            ["privacyTitleEn", "Privacy title EN"], ["privacyTitleAr", "Privacy title AR"],
            ["termsTitleEn", "Terms title EN"], ["termsTitleAr", "Terms title AR"]
          ].map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-semibold text-navy">{label}<input value={form.themeSettings.storefrontContent[key as keyof ThemeSettings["storefrontContent"]]} onChange={(event) => updateStorefrontContent(key as keyof ThemeSettings["storefrontContent"], event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" /></label>)}
          {[
            ["privacyBodyEn", "Privacy text EN"], ["privacyBodyAr", "Privacy text AR"],
            ["termsBodyEn", "Terms text EN"], ["termsBodyAr", "Terms text AR"]
          ].map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">{label}<textarea rows={4} value={form.themeSettings.storefrontContent[key as keyof ThemeSettings["storefrontContent"]]} onChange={(event) => updateStorefrontContent(key as keyof ThemeSettings["storefrontContent"], event.target.value)} className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm" /></label>)}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-navy">Store identity</h2>
          <SectionSaveButton />
        </div>
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

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-navy">Currency and shipping</h2>
          <SectionSaveButton />
        </div>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-neutral-950">Currency conversion</h3>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">Rates used when customers switch currency.</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-neutral-600">Base: AED</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  AED to BDT
                  <input type="number" min="0" step="0.0001" value={form.aedToBdt} onChange={(event) => updateForm("aedToBdt", event.target.value)} required className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  AED to USD
                  <input type="number" min="0" step="0.0001" value={form.aedToUsd} onChange={(event) => updateForm("aedToUsd", event.target.value)} required className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
                </label>
              </div>
              <p className="mt-4 border-t border-neutral-200 pt-3 text-xs font-semibold text-neutral-600">
                AED 100 preview: {formatCurrency(100, "BDT", locale, previewRates)} / {formatCurrency(100, "USD", locale, previewRates)}
              </p>
            </section>
            <section className="rounded-md border border-neutral-200 bg-white p-4">
              <div>
                <h3 className="font-bold text-neutral-950">VAT and business details</h3>
                <p className="mt-1 text-xs font-semibold text-neutral-500">Included VAT details are shown on invoices.</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  VAT rate %
                  <input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(event) => updateForm("vatRate", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  TRN
                  <input value={form.trn} onChange={(event) => updateForm("trn", event.target.value)} placeholder="VAT registration number" className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
                </label>
              </div>
              <p className="mt-4 border-t border-neutral-100 pt-3 text-xs font-semibold leading-5 text-neutral-500">Set VAT to 0 if the business is not VAT registered.</p>
            </section>
          </div>
          <div className="grid gap-4 rounded-md border border-neutral-300 bg-neutral-50 p-4">
            <div>
              <p className="font-bold text-navy">Checkout delivery controls</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                One delivery fee applies across checkout. Turn free delivery on when you want delivery to be free for every order.
              </p>
            </div>
            <div className="grid gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Free delivery from (AED)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.freeShippingThreshold}
                  onChange={(event) => updateForm("freeShippingThreshold", event.target.value)}
                  required
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Delivery label
                <input value={form.customAreaFee.areaLabel} onChange={(event) => updateCustomAreaFee("areaLabel", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Overall delivery fee (AED)
                <input type="number" min="0" step="0.01" value={form.customAreaFee.fee} onChange={(event) => updateCustomAreaFee("fee", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Estimated days
                <input value={form.customAreaFee.deliveryDays} onChange={(event) => updateCustomAreaFee("deliveryDays", event.target.value)} className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm" />
              </label>
            </div>
            <div className="grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-md border border-neutral-200 bg-white p-3 text-sm font-bold text-navy">
                <input type="checkbox" checked={form.themeSettings.checkoutControls.freeDeliveryEnabled} onChange={(event) => updateCheckoutControl("freeDeliveryEnabled", event.target.checked)} className="mt-1 h-4 w-4 accent-black" />
                <span><span className="block">Free delivery for all orders</span><span className="mt-1 block text-xs font-semibold text-neutral-500">Overrides fee and threshold.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-neutral-200 bg-white p-3 text-sm font-bold text-navy">
                <input type="checkbox" checked={form.themeSettings.checkoutControls.showCouponBox} onChange={(event) => updateCheckoutControl("showCouponBox", event.target.checked)} className="mt-1 h-4 w-4 accent-black" />
                <span><span className="block">Show coupon box</span><span className="mt-1 block text-xs font-semibold text-neutral-500">Hide when no offers should show.</span></span>
              </label>
            </div>
          </div>
          <Button type="submit" variant="secondary" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Delivery Controls"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              <Truck size={20} className="text-gold-700" />
              Dubai courier integration
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Save courier provider details now; shipment booking and live tracking can be connected when the provider account is ready.
            </p>
          </div>
          <label className="inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 bg-gold-50 px-3 text-xs font-black text-navy">
            <input
              type="checkbox"
              checked={form.courierSettings.enabled}
              onChange={(event) => updateCourier("enabled", event.target.checked)}
              className="accent-gold-500"
            />
            Courier ready
          </label>
          <SectionSaveButton />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Provider
            <select
              value={form.courierSettings.provider}
              onChange={(event) => updateCourier("provider", event.target.value as CourierSettings["provider"])}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              {courierProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Display name
            <input
              value={form.courierSettings.displayName}
              onChange={(event) => updateCourier("displayName", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Pickup city
            <input
              value={form.courierSettings.pickupCity}
              onChange={(event) => updateCourier("pickupCity", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Service level
            <input
              value={form.courierSettings.serviceLevel}
              onChange={(event) => updateCourier("serviceLevel", event.target.value)}
              placeholder="standard, same-day, express"
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Account number
            <input
              value={form.courierSettings.accountNumber}
              onChange={(event) => updateCourier("accountNumber", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            API key
            <input
              type="password"
              value={form.courierSettings.apiKey}
              onChange={(event) => updateCourier("apiKey", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            API secret
            <input
              type="password"
              value={form.courierSettings.apiSecret}
              onChange={(event) => updateCourier("apiSecret", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Webhook secret
            <input
              type="password"
              value={form.courierSettings.webhookSecret}
              onChange={(event) => updateCourier("webhookSecret", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy md:col-span-2">
            Tracking URL template
            <input
              value={form.courierSettings.trackingUrlTemplate}
              onChange={(event) => updateCourier("trackingUrlTemplate", event.target.value)}
              placeholder="https://provider.example/track/{trackingNumber}"
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy md:col-span-2">
            Courier notes
            <textarea
              rows={3}
              value={form.courierSettings.notes}
              onChange={(event) => updateCourier("notes", event.target.value)}
              placeholder="Pickup timing, contact person, API environment, or provider notes"
              className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">Payment controls</h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Enable methods, edit checkout labels, and add provider/account details from admin.
            </p>
          </div>
          <SectionSaveButton />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {paymentStatusCards.map((item) => {
            const Icon = item.icon;
            const enabled = form.paymentSettings[item.key].enabled;

            return (
              <div
                key={item.key}
                className="flex min-h-[116px] items-start gap-3 rounded-lg border border-neutral-200 bg-paper p-4 text-left"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white text-gold-700 shadow-sm">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-navy">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        enabled ? "bg-emerald-50 text-emerald-700" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {enabled ? "Visible" : "Hidden"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        item.configured ? "bg-gold-100 text-gold-800" : "bg-red-50 text-sale"
                      }`}
                    >
                      {item.configured ? "Configured" : "Setup needed"}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs font-semibold leading-5 text-neutral-500">{item.detail}</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5">
          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              COD availability
              <select
                value={form.paymentSettings.cod.availabilityMode}
                onChange={(event) =>
                  updateCodAvailabilityMode(event.target.value as PaymentSettings["cod"]["availabilityMode"])
                }
                className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="always">Available for any order</option>
                <option value="minimum">Available from minimum AED amount</option>
              </select>
            </label>
            {form.paymentSettings.cod.availabilityMode === "minimum" ? (
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Minimum order for COD (AED)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paymentSettings.cod.minOrderAmount}
                  onChange={(event) => updatePayment("cod", "minOrderAmount", Number(event.target.value))}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-semibold text-navy">
              COD display name
              <input
                value={form.paymentSettings.cod.displayName}
                onChange={(event) => updatePayment("cod", "displayName", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              />
            </label>
          </div>

        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">Storefront UI controls</h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Change the storefront colors and styling from admin without editing code.
            </p>
          </div>
          <SectionSaveButton />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["primaryColor", "Primary color"],
            ["accentColor", "Accent color"],
            ["paperColor", "Background color"],
            ["inkColor", "Text color"]
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
              {label}
              <span className="flex h-11 overflow-hidden rounded-md border border-neutral-200 bg-white">
                <input
                  type="color"
                  value={form.themeSettings[key as keyof ThemeSettings] as string}
                  onChange={(event) => updateTheme(key as keyof ThemeSettings, event.target.value as never)}
                  className="h-full w-14 cursor-pointer border-0 bg-transparent"
                />
                <input
                  value={form.themeSettings[key as keyof ThemeSettings] as string}
                  onChange={(event) => updateTheme(key as keyof ThemeSettings, event.target.value as never)}
                  className="min-w-0 flex-1 px-3 text-sm"
                />
              </span>
            </label>
          ))}
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Radius
            <select
              value={form.themeSettings.radius}
              onChange={(event) => updateTheme("radius", event.target.value as ThemeSettings["radius"])}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              <option value="compact">Compact</option>
              <option value="soft">Soft</option>
              <option value="rounded">Rounded</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Button style
            <select
              value={form.themeSettings.buttonStyle}
              onChange={(event) => updateTheme("buttonStyle", event.target.value as ThemeSettings["buttonStyle"])}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Solid</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Product cards
            <select
              value={form.themeSettings.productCardStyle}
              onChange={(event) => updateTheme("productCardStyle", event.target.value as ThemeSettings["productCardStyle"])}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
              <option value="elevated">Elevated</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Admin refresh (seconds)
            <input type="number" min="15" max="300" step="1" value={form.themeSettings.adminRefreshSeconds} onChange={(event) => updateTheme("adminRefreshSeconds", Number(event.target.value))} className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
          </label>
          <div className="rounded-md border border-neutral-200 bg-paper p-4 lg:col-span-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <span className="h-11 rounded-md" style={{ backgroundColor: form.themeSettings.primaryColor }} />
              <span className="h-11 rounded-md" style={{ backgroundColor: form.themeSettings.accentColor }} />
              <span className="h-11 rounded-md border border-neutral-200" style={{ backgroundColor: form.themeSettings.paperColor }} />
            </div>
          </div>
          <div className="grid gap-4 rounded-md border border-gold-100 bg-gold-50 p-4 lg:col-span-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-navy">Maintenance mode</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
                  Turn this on when the storefront should show a temporary closed message. Admin pages stay accessible.
                </p>
              </div>
              <label className="inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 bg-white px-3 text-xs font-black text-navy">
                <input
                  type="checkbox"
                  checked={form.themeSettings.maintenanceMode}
                  onChange={(event) => updateTheme("maintenanceMode", event.target.checked)}
                  className="accent-gold-500"
                />
                {form.themeSettings.maintenanceMode ? "Enabled" : "Disabled"}
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Maintenance title EN
                <input
                  value={form.themeSettings.maintenanceTitleEn}
                  onChange={(event) => updateTheme("maintenanceTitleEn", event.target.value)}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Maintenance title AR
                <input
                  value={form.themeSettings.maintenanceTitleAr}
                  onChange={(event) => updateTheme("maintenanceTitleAr", event.target.value)}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Maintenance message EN
                <textarea
                  rows={3}
                  value={form.themeSettings.maintenanceMessageEn}
                  onChange={(event) => updateTheme("maintenanceMessageEn", event.target.value)}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Maintenance message AR
                <textarea
                  rows={3}
                  value={form.themeSettings.maintenanceMessageAr}
                  onChange={(event) => updateTheme("maintenanceMessageAr", event.target.value)}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-navy">Contact and social</h2>
          <SectionSaveButton />
        </div>
        <div className="mt-5 grid gap-4">
          {[
            ["phone", "Phone", true],
            ["storeEmail", "Email", true],
            ["whatsapp", "WhatsApp", false],
            ["address", "Footer address", false],
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-navy">SEO and tracking</h2>
          <SectionSaveButton />
        </div>
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
