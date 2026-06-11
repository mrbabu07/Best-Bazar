"use client";

import { CalendarClock, CreditCard, HandCoins, Landmark, Save, Wallet, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import type { PaymentSettings } from "@/lib/payment-config";
import type { ThemeSettings } from "@/lib/theme-config";
import { formatCurrency, normalizeCurrencyRates } from "@/utils/currency";
import { shippingRatesToRecord } from "@/utils/shipping";

type ShippingRate = {
  key: string;
  nameEn: string;
  nameAr: string;
  cost: string;
  freeFrom: string;
  deliveryDays: string;
  codAvailable: boolean;
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

type PaymentMethodKey = keyof PaymentSettings;

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

  const updateRate = (index: number, key: keyof ShippingRate, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      shippingRates: current.shippingRates.map((rate, rateIndex) =>
        rateIndex === index ? { ...rate, [key]: value } : rate
      )
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

  const togglePaymentVisibility = (method: PaymentMethodKey) => {
    setForm((current) => ({
      ...current,
      paymentSettings: {
        ...current.paymentSettings,
        [method]: {
          ...current.paymentSettings[method],
          enabled: !current.paymentSettings[method].enabled
        }
      }
    }));
  };

  const stripeReady =
    Boolean(form.paymentSettings.stripe.secretKey.trim()) &&
    (form.paymentSettings.stripe.mode === "hosted_checkout" ||
      Boolean(form.paymentSettings.stripe.publishableKey.trim()));
  const paymentStatusCards = [
    {
      key: "stripe" as const,
      label: "Stripe / card",
      detail:
        form.paymentSettings.stripe.mode === "payment_element"
          ? "Inline card form needs publishable + secret key"
          : "Hosted checkout needs secret key",
      icon: CreditCard,
      configured: stripeReady
    },
    {
      key: "cod" as const,
      label: "Cash on delivery",
      detail: "Manual payment at delivery",
      icon: HandCoins,
      configured: true
    },
    {
      key: "bankTransfer" as const,
      label: "Bank transfer",
      detail: "Bank details or instructions required",
      icon: Landmark,
      configured: Boolean(
        form.paymentSettings.bankTransfer.instructions.trim() ||
          form.paymentSettings.bankTransfer.bankName.trim() ||
          form.paymentSettings.bankTransfer.iban.trim() ||
          form.paymentSettings.bankTransfer.accountNumber.trim()
      )
    },
    {
      key: "tabby" as const,
      label: "Tabby",
      detail: "Secret key + merchant code required",
      icon: WalletCards,
      configured: Boolean(form.paymentSettings.tabby.secretKey.trim() && form.paymentSettings.tabby.merchantCode.trim())
    },
    {
      key: "tamara" as const,
      label: "Tamara",
      detail: "API token required",
      icon: CalendarClock,
      configured: Boolean(form.paymentSettings.tamara.apiToken.trim())
    },
    {
      key: "paypal" as const,
      label: "PayPal",
      detail: "Client ID + client secret required",
      icon: Wallet,
      configured: Boolean(form.paymentSettings.paypal.clientId.trim() && form.paymentSettings.paypal.clientSecret.trim())
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
      paymentSettings: form.paymentSettings,
      themeSettings: form.themeSettings,
      shippingRates: shippingRatesToRecord(
        form.shippingRates.map((rate) => ({
          key: rate.key,
          emirate: rate.nameEn,
          nameEn: rate.nameEn,
          nameAr: rate.nameAr,
          cost: Number(rate.cost),
          freeFrom: Number(rate.freeFrom),
          deliveryDays: rate.deliveryDays,
          codAvailable: rate.codAvailable
        }))
      ),
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
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-[760px] divide-y divide-neutral-200 text-sm">
              <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Emirate</th>
                  <th className="px-3 py-3">Shipping Fee (AED)</th>
                  <th className="px-3 py-3">Free Shipping From (AED)</th>
                  <th className="px-3 py-3">Est. Days</th>
                  <th className="px-3 py-3">COD Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {form.shippingRates.map((rate, index) => (
                  <tr key={rate.key} className="align-middle">
                    <td className="px-3 py-3">
                      <p className="font-bold text-navy">{locale === "ar" ? rate.nameAr : rate.nameEn}</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-400">{rate.key}</p>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rate.cost}
                        onChange={(event) => updateRate(index, "cost", event.target.value)}
                        required
                        className="h-10 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rate.freeFrom}
                        onChange={(event) => updateRate(index, "freeFrom", event.target.value)}
                        required
                        className="h-10 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={rate.deliveryDays}
                        onChange={(event) => updateRate(index, "deliveryDays", event.target.value)}
                        required
                        className="h-10 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <label className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-paper px-3 text-xs font-bold text-navy">
                        <input
                          type="checkbox"
                          checked={rate.codAvailable}
                          onChange={(event) => updateRate(index, "codAvailable", event.target.checked)}
                          className="accent-gold-500"
                        />
                        COD
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="submit" variant="secondary" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Shipping Rates"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <h2 className="text-lg font-bold text-navy">Payment controls</h2>
        <p className="mt-1 text-sm font-semibold text-neutral-500">
          Enable methods, edit checkout labels, and add provider/account details from admin.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {paymentStatusCards.map((item) => {
            const Icon = item.icon;
            const enabled = form.paymentSettings[item.key].enabled;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => togglePaymentVisibility(item.key)}
                className="flex min-h-[116px] items-start gap-3 rounded-lg border border-neutral-200 bg-paper p-4 text-left transition hover:border-gold-300 hover:bg-gold-50"
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
                  <span className="mt-3 block text-xs font-bold text-gold-800">
                    Click to {enabled ? "hide from checkout" : "show at checkout"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.cod.enabled}
                onChange={(event) => updatePayment("cod", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show Cash on delivery at checkout
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              COD display name
              <input
                value={form.paymentSettings.cod.displayName}
                onChange={(event) => updatePayment("cod", "displayName", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              COD instructions
              <textarea
                rows={3}
                value={form.paymentSettings.cod.instructions}
                onChange={(event) => updatePayment("cod", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.bankTransfer.enabled}
                onChange={(event) => updatePayment("bankTransfer", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show Bank transfer at checkout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["displayName", "Display name"],
                ["bankName", "Bank name"],
                ["accountName", "Account name"],
                ["accountNumber", "Account number"],
                ["iban", "IBAN"],
                ["swift", "SWIFT"],
                ["branch", "Branch"]
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    value={form.paymentSettings.bankTransfer[key as keyof PaymentSettings["bankTransfer"]] as string}
                    onChange={(event) =>
                      updatePayment("bankTransfer", key as keyof PaymentSettings["bankTransfer"], event.target.value as never)
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Bank transfer instructions
              <textarea
                rows={3}
                value={form.paymentSettings.bankTransfer.instructions}
                onChange={(event) => updatePayment("bankTransfer", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.stripe.enabled}
                onChange={(event) => updatePayment("stripe", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show Stripe / card at checkout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Display name
                <input
                  value={form.paymentSettings.stripe.displayName}
                  onChange={(event) => updatePayment("stripe", "displayName", event.target.value)}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Stripe mode
                <select
                  value={form.paymentSettings.stripe.mode}
                  onChange={(event) => updatePayment("stripe", "mode", event.target.value as PaymentSettings["stripe"]["mode"])}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                >
                  <option value="payment_element">Inline card form</option>
                  <option value="hosted_checkout">Hosted checkout</option>
                </select>
              </label>
              {[
                ["publishableKey", "Publishable key"],
                ["secretKey", "Secret key"],
                ["webhookSecret", "Webhook secret"]
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    type={key === "publishableKey" ? "text" : "password"}
                    value={form.paymentSettings.stripe[key as keyof PaymentSettings["stripe"]] as string}
                    placeholder={
                      key === "publishableKey" ? "pk_live_..." : key === "secretKey" ? "sk_live_..." : "whsec_..."
                    }
                    onChange={(event) =>
                      updatePayment("stripe", key as keyof PaymentSettings["stripe"], event.target.value as never)
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Stripe checkout text
              <textarea
                rows={3}
                value={form.paymentSettings.stripe.instructions}
                onChange={(event) => updatePayment("stripe", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.tabby.enabled}
                onChange={(event) => updatePayment("tabby", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show Tabby at checkout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["displayName", "Display name", "text"],
                ["secretKey", "Secret key", "password"],
                ["merchantCode", "Merchant code", "text"],
                ["apiBaseUrl", "API base URL", "text"]
              ].map(([key, label, type]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    type={type}
                    value={form.paymentSettings.tabby[key as keyof PaymentSettings["tabby"]] as string}
                    onChange={(event) =>
                      updatePayment("tabby", key as keyof PaymentSettings["tabby"], event.target.value as never)
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Tabby checkout text
              <textarea
                rows={2}
                value={form.paymentSettings.tabby.instructions}
                onChange={(event) => updatePayment("tabby", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.tamara.enabled}
                onChange={(event) => updatePayment("tamara", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show Tamara at checkout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["displayName", "Display name", "text"],
                ["apiToken", "API token", "password"],
                ["apiBaseUrl", "API base URL", "text"]
              ].map(([key, label, type]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    type={type}
                    value={form.paymentSettings.tamara[key as keyof PaymentSettings["tamara"]] as string}
                    onChange={(event) =>
                      updatePayment("tamara", key as keyof PaymentSettings["tamara"], event.target.value as never)
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Tamara checkout text
              <textarea
                rows={2}
                value={form.paymentSettings.tamara.instructions}
                onChange={(event) => updatePayment("tamara", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-md border border-neutral-200 bg-paper p-4">
            <label className="flex items-center gap-2 text-sm font-bold text-navy">
              <input
                type="checkbox"
                checked={form.paymentSettings.paypal.enabled}
                onChange={(event) => updatePayment("paypal", "enabled", event.target.checked)}
                className="accent-gold-500"
              />
              Show PayPal at checkout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["displayName", "Display name", "text"],
                ["clientId", "Client ID", "text"],
                ["clientSecret", "Client secret", "password"],
                ["apiBaseUrl", "API base URL", "text"]
              ].map(([key, label, type]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    type={type}
                    value={form.paymentSettings.paypal[key as keyof PaymentSettings["paypal"]] as string}
                    onChange={(event) =>
                      updatePayment("paypal", key as keyof PaymentSettings["paypal"], event.target.value as never)
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              PayPal checkout text
              <textarea
                rows={2}
                value={form.paymentSettings.paypal.instructions}
                onChange={(event) => updatePayment("paypal", "instructions", event.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:col-span-2">
        <h2 className="text-lg font-bold text-navy">Storefront UI controls</h2>
        <p className="mt-1 text-sm font-semibold text-neutral-500">
          Change the storefront colors and styling from admin without editing code.
        </p>
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
          <div className="rounded-md border border-neutral-200 bg-paper p-4 lg:col-span-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <span className="h-11 rounded-md" style={{ backgroundColor: form.themeSettings.primaryColor }} />
              <span className="h-11 rounded-md" style={{ backgroundColor: form.themeSettings.accentColor }} />
              <span className="h-11 rounded-md border border-neutral-200" style={{ backgroundColor: form.themeSettings.paperColor }} />
            </div>
          </div>
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
