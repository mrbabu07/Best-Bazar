"use client";

import Image from "next/image";
import { Edit, GripVertical, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

export type AdminBannerRow = {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  buttonTextEn: string;
  buttonTextAr: string;
  buttonLink: string;
  desktopImage: string;
  mobileImage: string;
  sortOrder: number;
  isActive: boolean;
};

type BannerForm = Omit<AdminBannerRow, "id" | "sortOrder"> & {
  sortOrder: string;
};

type AdminBannerManagerProps = {
  locale: Locale;
  banners: AdminBannerRow[];
};

const emptyForm: BannerForm = {
  titleEn: "",
  titleAr: "",
  subtitleEn: "",
  subtitleAr: "",
  buttonTextEn: "",
  buttonTextAr: "",
  buttonLink: "/en/shop",
  desktopImage: "",
  mobileImage: "",
  sortOrder: "0",
  isActive: true
};

function fromBanner(banner: AdminBannerRow): BannerForm {
  return {
    titleEn: banner.titleEn,
    titleAr: banner.titleAr,
    subtitleEn: banner.subtitleEn,
    subtitleAr: banner.subtitleAr,
    buttonTextEn: banner.buttonTextEn,
    buttonTextAr: banner.buttonTextAr,
    buttonLink: banner.buttonLink,
    desktopImage: banner.desktopImage,
    mobileImage: banner.mobileImage,
    sortOrder: String(banner.sortOrder),
    isActive: banner.isActive
  };
}

function getTitle(banner: AdminBannerRow, locale: Locale) {
  return locale === "ar" ? banner.titleAr : banner.titleEn;
}

export function AdminBannerManager({ locale, banners }: AdminBannerManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const selectedBanner = useMemo(
    () => banners.find((banner) => banner.id === selectedId),
    [banners, selectedId]
  );

  const updateForm = <Key extends keyof BannerForm>(key: Key, value: BannerForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startCreate = () => {
    setSelectedId("");
    setForm(emptyForm);
  };

  const startEdit = (banner: AdminBannerRow) => {
    setSelectedId(banner.id);
    setForm(fromBanner(banner));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      titleEn: form.titleEn,
      titleAr: form.titleAr,
      subtitleEn: form.subtitleEn || null,
      subtitleAr: form.subtitleAr || null,
      buttonTextEn: form.buttonTextEn || null,
      buttonTextAr: form.buttonTextAr || null,
      buttonLink: form.buttonLink,
      desktopImage: form.desktopImage,
      mobileImage: form.mobileImage || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive
    };
    const endpoint = selectedId ? `/api/admin/banners/${selectedId}` : "/api/admin/banners";

    try {
      const response = await fetch(endpoint, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save banner.");
      }

      toast.success(selectedId ? "Banner updated" : "Banner created");
      if (!selectedId) {
        setForm(emptyForm);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="grid gap-3">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[auto_160px_1fr_auto]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-md bg-paper text-neutral-400">
              <GripVertical size={18} />
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={banner.desktopImage}
                alt={banner.titleEn}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-navy">{getTitle(banner, locale)}</h2>
              <p className="mt-1 text-sm text-neutral-500">{banner.buttonLink}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={banner.isActive ? "green" : "red"}>
                  {banner.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge tone="gold">#{banner.sortOrder}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <button
                type="button"
                onClick={() => startEdit(banner)}
                className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
                aria-label={`Edit banner ${banner.titleEn}`}
              >
                <Edit size={15} />
              </button>
              <AdminDeleteButton
                endpoint={`/api/admin/banners/${banner.id}`}
                label={`Delete banner ${banner.titleEn}?`}
                successMessage="Banner deleted"
              />
            </div>
          </article>
        ))}
      </section>

      <aside id="banner-editor" className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">Banner editor</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {selectedBanner ? `Editing ${selectedBanner.titleEn}` : "Create a new banner"}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={startCreate}>
            <Plus size={15} />
            New
          </Button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          {[
            ["titleEn", "Title EN"],
            ["titleAr", "Title AR"],
            ["subtitleEn", "Subtitle EN"],
            ["subtitleAr", "Subtitle AR"],
            ["buttonTextEn", "Button text EN"],
            ["buttonTextAr", "Button text AR"],
            ["buttonLink", "Button link URL"]
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
              {label}
              <input
                value={form[key as keyof BannerForm] as string}
                onChange={(event) => updateForm(key as keyof BannerForm, event.target.value as never)}
                required={key === "titleEn" || key === "titleAr" || key === "buttonLink"}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Sort order
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) => updateForm("sortOrder", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <AdminImageUploadField
            label="Desktop image"
            value={form.desktopImage}
            onChange={(value) => updateForm("desktopImage", value)}
            previewAlt={form.titleEn}
            aspectClassName="aspect-[16/9]"
          />
          <AdminImageUploadField
            label="Mobile image"
            value={form.mobileImage}
            onChange={(value) => updateForm("mobileImage", value)}
            previewAlt={form.titleEn}
            aspectClassName="aspect-[4/5]"
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
              className="accent-gold-500"
            />
            Active
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="secondary" onClick={startCreate}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
