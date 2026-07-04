"use client";

import Image from "next/image";
import { Edit, GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  customFieldTypeOptions,
  makeCustomFieldId,
  productTypeOptions,
  type CategoryCustomField,
  type CategoryCustomFieldType,
  type ProductType
} from "@/lib/category-fields";
import { fallbackCategoryImage, safeRemoteImage } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import { safeResponseJson } from "@/lib/safe-json";

export type AdminCategoryRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  image: string;
  productType: ProductType;
  customFields: CategoryCustomField[];
  parentCategoryId: string;
  parentCategoryNameEn: string;
  productCount: number;
  subcategoryCount: number;
  sortOrder: number;
  isActive: boolean;
};

type CategoryForm = {
  nameEn: string;
  nameAr: string;
  slug: string;
  image: string;
  productType: ProductType;
  customFields: CategoryCustomField[];
  parentCategoryId: string;
  sortOrder: string;
  isActive: boolean;
};

type AdminCategoryManagerProps = {
  locale: Locale;
  categories: AdminCategoryRow[];
  saveLabel: string;
};

const emptyForm: CategoryForm = {
  nameEn: "",
  nameAr: "",
  slug: "",
  image: "",
  productType: "GENERAL",
  customFields: [],
  parentCategoryId: "",
  sortOrder: "0",
  isActive: true
};

function fromCategory(category: AdminCategoryRow): CategoryForm {
  return {
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    slug: category.slug,
    image: category.image,
    productType: category.productType,
    customFields: category.customFields,
    parentCategoryId: category.parentCategoryId,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive
  };
}

function getDisplayName(category: AdminCategoryRow, locale: Locale) {
  return locale === "ar" ? category.nameAr : category.nameEn;
}

export function AdminCategoryManager({ locale, categories, saveLabel }: AdminCategoryManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedId),
    [categories, selectedId]
  );

  const updateForm = <Key extends keyof CategoryForm>(key: Key, value: CategoryForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addCustomField = () => {
    setForm((current) => ({
      ...current,
      customFields: [
        ...current.customFields,
        {
          id: `field-${Date.now()}`,
          labelEn: "",
          labelAr: "",
          type: "TEXT",
          required: false
        }
      ]
    }));
  };

  const updateCustomField = <Key extends keyof CategoryCustomField>(
    index: number,
    key: Key,
    value: CategoryCustomField[Key]
  ) => {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((field, fieldIndex) => {
        if (fieldIndex !== index) {
          return field;
        }

        const next = { ...field, [key]: value };

        if (key === "labelEn" && (!field.id || field.id.startsWith("field-"))) {
          next.id = makeCustomFieldId(String(value));
        }

        return next;
      })
    }));
  };

  const removeCustomField = (index: number) => {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.filter((_, fieldIndex) => fieldIndex !== index)
    }));
  };

  const startCreate = () => {
    setSelectedId("");
    setForm(emptyForm);
  };

  const startEdit = (category: AdminCategoryRow) => {
    setSelectedId(category.id);
    setForm(fromCategory(category));
    window.requestAnimationFrame(() => document.getElementById("category-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      slug: form.slug,
      image: form.image || null,
      productType: form.productType,
      customFields: form.customFields
        .filter((field) => field.labelEn.trim() && field.labelAr.trim())
        .map((field) => ({
          ...field,
          id: field.id || makeCustomFieldId(field.labelEn)
        })),
      parentCategoryId: form.parentCategoryId || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive
    };
    const endpoint = selectedId ? `/api/admin/categories/${selectedId}` : "/api/admin/categories";

    try {
      const response = await fetch(endpoint, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save category.");
      }

      toast.success(selectedId ? "Category updated" : "Category created");
      if (!selectedId) {
        setForm(emptyForm);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="grid gap-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[auto_96px_1fr_auto]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-md bg-paper text-neutral-400">
              <GripVertical size={18} />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={safeRemoteImage(category.image, fallbackCategoryImage)}
                alt={getDisplayName(category, locale)}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-navy">{getDisplayName(category, locale)}</h2>
              <p className="mt-1 text-sm text-neutral-500">{category.slug}</p>
              <p className="mt-2 text-sm text-neutral-600">
                {category.productCount} products
                {category.parentCategoryNameEn ? ` | parent: ${category.parentCategoryNameEn}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <Badge tone={category.isActive ? "green" : "red"}>
                {category.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge tone="blue">
                {productTypeOptions.find((option) => option.value === category.productType)?.label ?? "General product"}
              </Badge>
              {category.customFields.length ? <Badge tone="gold">{category.customFields.length} custom</Badge> : null}
              <Badge tone="gold">#{category.sortOrder}</Badge>
              <button
                type="button"
                onClick={() => startEdit(category)}
                className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
                aria-label={`Edit ${category.nameEn}`}
              >
                <Edit size={15} />
              </button>
              {category.productCount === 0 && category.subcategoryCount === 0 ? (
                <AdminDeleteButton
                  endpoint={`/api/admin/categories/${category.id}`}
                  label={`Delete category ${category.nameEn}?`}
                  successMessage="Category deleted"
                />
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <aside id="category-editor" className="scroll-mt-20 h-fit rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">Category editor</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {selectedCategory ? `Editing ${selectedCategory.nameEn}` : "Create a new category"}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={startCreate}>
            <Plus size={15} />
            New
          </Button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Name EN
            <input
              value={form.nameEn}
              onChange={(event) => updateForm("nameEn", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Name AR
            <input
              value={form.nameAr}
              onChange={(event) => updateForm("nameAr", event.target.value)}
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Slug
            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
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
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Parent category
            <select
              value={form.parentCategoryId}
              onChange={(event) => updateForm("parentCategoryId", event.target.value)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              <option value="">None</option>
              {categories
                .filter((category) => category.id !== selectedId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {getDisplayName(category, locale)}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Product type
            <select
              value={form.productType}
              onChange={(event) => updateForm("productType", event.target.value as ProductType)}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            >
              {productTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy">Custom product fields</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  These fields appear automatically when adding products in this category.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addCustomField}>
                <Plus size={15} />
                Field
              </Button>
            </div>
            {form.customFields.length ? (
              form.customFields.map((field, index) => (
                <div key={`${field.id}-${index}`} className="grid gap-2 rounded-md border border-neutral-200 bg-white p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={field.labelEn}
                      onChange={(event) => updateCustomField(index, "labelEn", event.target.value)}
                      placeholder="Label EN"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <input
                      value={field.labelAr}
                      onChange={(event) => updateCustomField(index, "labelAr", event.target.value)}
                      placeholder="Label AR"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <select
                      value={field.type}
                      onChange={(event) =>
                        updateCustomField(index, "type", event.target.value as CategoryCustomFieldType)
                      }
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    >
                      {customFieldTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-semibold text-navy">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) => updateCustomField(index, "required", event.target.checked)}
                        className="accent-gold-500"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                      aria-label="Remove custom field"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-500">
                No custom fields yet.
              </p>
            )}
          </div>
          <AdminImageUploadField
            label="Category image"
            value={form.image}
            onChange={(value) => updateForm("image", value)}
            previewAlt={form.nameEn}
            aspectClassName="aspect-square"
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
              {saving ? "Saving..." : saveLabel}
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
