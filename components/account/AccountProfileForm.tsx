"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

export type AccountProfileData = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  country: string;
};

type AccountProfileFormProps = {
  locale: Locale;
  profile: AccountProfileData;
  saveLabel: string;
};

const labels = {
  en: {
    name: "Name",
    email: "Email",
    phone: "Phone",
    street: "Street address",
    city: "City",
    country: "Country",
    saving: "Saving...",
    saved: "Profile saved",
    failed: "Unable to update profile."
  },
  ar: {
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    street: "العنوان",
    city: "المدينة",
    country: "الدولة",
    saving: "جار الحفظ...",
    saved: "تم حفظ الملف الشخصي",
    failed: "تعذر تحديث الملف الشخصي."
  }
};

export function AccountProfileForm({ locale, profile, saveLabel }: AccountProfileFormProps) {
  const router = useRouter();
  const copy = labels[locale];
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  const updateForm = <Key extends keyof AccountProfileData>(key: Key, value: AccountProfileData[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          street: form.street,
          city: form.city,
          country: form.country
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? copy.failed);
      }

      setForm({
        name: result.name ?? "",
        email: result.email ?? profile.email,
        phone: result.phone ?? "",
        street: result.street ?? "",
        city: result.city ?? "",
        country: result.country ?? ""
      });
      toast.success(copy.saved);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {copy.name}
        <input
          value={form.name}
          onChange={(event) => updateForm("name", event.target.value)}
          required
          autoComplete="name"
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {copy.email}
        <input
          value={form.email}
          readOnly
          autoComplete="email"
          className="h-11 rounded-md border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-500"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {copy.phone}
        <input
          value={form.phone}
          onChange={(event) => updateForm("phone", event.target.value)}
          autoComplete="tel"
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {copy.city}
        <input
          value={form.city}
          onChange={(event) => updateForm("city", event.target.value)}
          autoComplete="address-level2"
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
        {copy.street}
        <input
          value={form.street}
          onChange={(event) => updateForm("street", event.target.value)}
          autoComplete="street-address"
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {copy.country}
        <input
          value={form.country}
          onChange={(event) => updateForm("country", event.target.value)}
          autoComplete="country-name"
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
        />
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={saving}>
          <Save size={17} />
          {saving ? copy.saving : saveLabel}
        </Button>
      </div>
    </form>
  );
}
