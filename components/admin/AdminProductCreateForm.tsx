"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  PackageCheck,
  Palette,
  Plus,
  RotateCcw,
  Store,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { AdminImageUploadField } from "@/components/admin/AdminImageUploadField";
import { AdminMediaUploadField } from "@/components/admin/AdminMediaUploadField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  emptyFashionFields,
  fashionCoreFields,
  isFashionProductType,
  type CategoryCustomField,
  type FashionFields,
  type ProductType
} from "@/lib/category-fields";
import type { Locale } from "@/lib/i18n";
import { getCategorySizeOptions, isSingleDefaultSize, type ProductSizeOption } from "@/lib/product-size-presets";
import { safeResponseJson } from "@/lib/safe-json";
import { formatCurrency } from "@/utils/currency";

type ProductImageForm = {
  url: string;
  alt: string;
  sortOrder: string;
};

type ProductVariantForm = {
  colorNameEn: string;
  colorNameAr: string;
  colorHex: string;
  sizeKey: string;
  sizeNameEn: string;
  sizeNameAr: string;
  styleNameEn: string;
  styleNameAr: string;
  fitNameEn: string;
  fitNameAr: string;
  imageUrl: string;
  sku: string;
  stock: string;
  sortOrder: string;
  isActive: boolean;
};

type ProductSpecificationForm = {
  keyEn: string;
  keyAr: string;
  valueEn: string;
  valueAr: string;
  sortOrder: string;
};

type ProductForm = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  metaTitleEn: string;
  metaTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  ogImage: string;
  shortVideoUrl: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  brand: string;
  tags: string;
  fashionFields: FashionFields;
  customFieldValues: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImageForm[];
  variants: ProductVariantForm[];
  specifications: ProductSpecificationForm[];
};

type ProductCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  productType: ProductType;
  customFields: CategoryCustomField[];
};

type AdminProductCreateFormProps = {
  locale: Locale;
  categories: ProductCategory[];
  productsHref: string;
};

function createEmptyForm(categoryId = ""): ProductForm {
  return {
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    metaTitleEn: "",
    metaTitleAr: "",
    metaDescriptionEn: "",
    metaDescriptionAr: "",
    ogImage: "",
    shortVideoUrl: "",
    slug: "",
    categoryId,
    subcategoryId: "",
    price: "0",
    comparePrice: "",
    stock: "0",
    sku: "",
    brand: "",
    tags: "",
    fashionFields: { ...emptyFashionFields },
    customFieldValues: {},
    isActive: true,
    isFeatured: false,
    images: [{ url: "", alt: "", sortOrder: "0" }],
    variants: [],
    specifications: []
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const customSizeValue = "__custom__";

function sizeFields(size?: ProductSizeOption) {
  return {
    sizeKey: size?.key ?? "",
    sizeNameEn: size?.nameEn ?? "",
    sizeNameAr: size?.nameAr ?? ""
  };
}

export function AdminProductCreateForm({ locale, categories, productsHref }: AdminProductCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(() => createEmptyForm(categories[0]?.id ?? ""));
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentCategory = categories.find((category) => category.id === form.categoryId);
  const currentCategoryName = currentCategory
    ? locale === "ar"
      ? currentCategory.nameAr
      : currentCategory.nameEn
    : "No category";
  const isFashionCategory = isFashionProductType(currentCategory?.productType);
  const categoryCustomFields = currentCategory?.customFields ?? [];
  const sizeOptions = getCategorySizeOptions(currentCategory);
  const sizeRequired = !isSingleDefaultSize(sizeOptions);
  const activeVariants = form.variants.filter((variant) => variant.isActive && variant.colorNameEn.trim());
  const activeVariantCount = activeVariants.length;
  const variantStock = activeVariants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
  const effectiveStock = form.variants.length ? variantStock : Number(form.stock || 0);
  const imageCount = form.images.filter((image) => image.url.trim()).length;
  const isCatalogReady = Boolean(
    form.nameEn.trim() && form.nameAr.trim() && form.slug.trim() && form.sku.trim() && form.categoryId
  );
  const isPricingReady = Number(form.price || 0) > 0 && effectiveStock > 0;
  const isMediaReady = imageCount > 0;
  const isVariantSetupReady = form.variants.every(
    (variant) =>
      (!variant.colorNameEn.trim() && !variant.colorNameAr.trim()) ||
      (variant.colorNameEn.trim() &&
        variant.colorNameAr.trim() &&
        (!sizeRequired || variant.sizeNameEn.trim() || variant.sizeNameAr.trim()))
  );
  const isReadyForSale = isCatalogReady && isPricingReady && isMediaReady && isVariantSetupReady && form.isActive;
  const readiness: { label: string; value: string; ready: boolean; icon: LucideIcon }[] = [
    {
      label: "Catalog",
      value: isCatalogReady ? currentCategoryName : "Name, slug, SKU, category",
      ready: isCatalogReady,
      icon: Store
    },
    {
      label: "Price & stock",
      value: isPricingReady ? `${formatCurrency(Number(form.price || 0), "AED", locale)} / ${effectiveStock} pcs` : "Price and stock needed",
      ready: isPricingReady,
      icon: PackageCheck
    },
    {
      label: "Media",
      value: isMediaReady ? `${imageCount} image${imageCount > 1 ? "s" : ""} ready` : "Main image needed",
      ready: isMediaReady,
      icon: ImagePlus
    },
    {
      label: "Variants",
      value: activeVariantCount ? `${activeVariantCount} stock row${activeVariantCount > 1 ? "s" : ""}` : "Optional variants",
      ready: isVariantSetupReady,
      icon: Palette
    }
  ];

  const updateForm = <Key extends keyof ProductForm>(key: Key, value: ProductForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateFashionField = <Key extends keyof FashionFields>(key: Key, value: FashionFields[Key]) => {
    setForm((current) => ({
      ...current,
      fashionFields: {
        ...current.fashionFields,
        [key]: value
      }
    }));
  };

  const updateCustomFieldValue = (fieldId: string, value: string) => {
    setForm((current) => ({
      ...current,
      customFieldValues: {
        ...current.customFieldValues,
        [fieldId]: value
      }
    }));
  };

  const updateNameEn = (value: string) => {
    setForm((current) => ({
      ...current,
      nameEn: value,
      slug: slugEdited ? current.slug : slugify(value)
    }));
  };

  const resetForm = () => {
    setForm(createEmptyForm(categories[0]?.id ?? ""));
    setSlugEdited(false);
  };

  const updateImage = (index: number, key: keyof ProductImageForm, value: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [key]: value } : image
      )
    }));
  };

  const addImage = () => {
    setForm((current) => ({
      ...current,
      images: [...current.images, { url: "", alt: "", sortOrder: String(current.images.length) }]
    }));
  };

  const addUploadedImages = (urls: string[]) => {
    setForm((current) => {
      const filledImages = current.images.filter((image) => image.url.trim());
      const uploadedImages = urls.map((url, index) => ({
        url,
        alt: form.nameEn || `Product image ${filledImages.length + index + 1}`,
        sortOrder: String(filledImages.length + index)
      }));

      return {
        ...current,
        images: [...filledImages, ...uploadedImages]
      };
    });
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.length === 1
        ? [{ url: "", alt: "", sortOrder: "0" }]
        : current.images.filter((_, imageIndex) => imageIndex !== index)
    }));
  };

  const updateVariant = (index: number, key: keyof ProductVariantForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    }));
  };

  const updateVariantSize = (index: number, value: string) => {
    const size = sizeOptions.find((option) => option.key === value);

    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? value === customSizeValue
            ? { ...variant, sizeKey: "", sizeNameEn: "", sizeNameAr: "" }
            : { ...variant, ...sizeFields(size) }
          : variant
      )
    }));
  };

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          colorNameEn: "",
          colorNameAr: "",
          colorHex: "#000000",
          ...sizeFields(sizeOptions[0]),
          styleNameEn: "",
          styleNameAr: "",
          fitNameEn: "",
          fitNameAr: "",
          imageUrl: "",
          sku: "",
          stock: "0",
          sortOrder: String(current.variants.length),
          isActive: true
        }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index)
    }));
  };

  const updateSpecification = (index: number, key: keyof ProductSpecificationForm, value: string) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((specification, specificationIndex) =>
        specificationIndex === index ? { ...specification, [key]: value } : specification
      )
    }));
  };

  const addSpecification = () => {
    setForm((current) => ({
      ...current,
      specifications: [
        ...current.specifications,
        { keyEn: "", keyAr: "", valueEn: "", valueAr: "", sortOrder: String(current.specifications.length) }
      ]
    }));
  };

  const removeSpecification = (index: number) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.filter((_, specificationIndex) => specificationIndex !== index)
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isMediaReady) {
      toast.error("Add at least one product image.");
      return;
    }

    if (!isVariantSetupReady) {
      toast.error("Complete color and size fields, or remove the empty stock row.");
      return;
    }

    setSaving(true);

    const payload = {
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      descriptionEn: form.descriptionEn,
      descriptionAr: form.descriptionAr,
      metaTitleEn: form.metaTitleEn || null,
      metaTitleAr: form.metaTitleAr || null,
      metaDescriptionEn: form.metaDescriptionEn || null,
      metaDescriptionAr: form.metaDescriptionAr || null,
      ogImage: form.ogImage || null,
      shortVideoUrl: form.shortVideoUrl || null,
      slug: form.slug,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock),
      sku: form.sku,
      brand: form.brand,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      fashionFields: isFashionCategory ? form.fashionFields : { ...emptyFashionFields },
      customFieldValues: Object.fromEntries(
        categoryCustomFields.map((field) => [field.id, form.customFieldValues[field.id] ?? ""])
      ),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      images: form.images
        .filter((image) => image.url.trim())
        .map((image, index) => ({
          url: image.url,
          alt: image.alt || form.nameEn,
          sortOrder: Number(image.sortOrder || index)
        })),
      variants: form.variants
        .filter((variant) => variant.colorNameEn.trim() && variant.colorNameAr.trim())
        .map((variant, index) => ({
          colorNameEn: variant.colorNameEn,
          colorNameAr: variant.colorNameAr,
          colorHex: variant.colorHex || null,
          sizeKey: variant.sizeKey || null,
          sizeNameEn: variant.sizeNameEn || null,
          sizeNameAr: variant.sizeNameAr || null,
          styleNameEn: isFashionCategory ? variant.styleNameEn || null : null,
          styleNameAr: isFashionCategory ? variant.styleNameAr || null : null,
          fitNameEn: isFashionCategory ? variant.fitNameEn || null : null,
          fitNameAr: isFashionCategory ? variant.fitNameAr || null : null,
          imageUrl: variant.imageUrl || null,
          sku: variant.sku || null,
          stock: Number(variant.stock || 0),
          sortOrder: Number(variant.sortOrder || index),
          isActive: variant.isActive
        })),
      specifications: form.specifications
        .filter((specification) => specification.keyEn && specification.keyAr && specification.valueEn && specification.valueAr)
        .map((specification, index) => ({
          keyEn: specification.keyEn,
          keyAr: specification.keyAr,
          valueEn: specification.valueEn,
          valueAr: specification.valueAr,
          sortOrder: Number(specification.sortOrder || index)
        }))
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to create product.");
      }

      toast.success("Product created");
      router.push(productsHref);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form id="create-product-form" onSubmit={submit} className="grid gap-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 1</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Catalog identity</h2>
              <p className="mt-1 text-sm text-neutral-600">Name, URL, SKU, brand, and category for the storefront.</p>
            </div>
            <Badge tone={isCatalogReady ? "green" : "gold"}>{isCatalogReady ? "Complete" : "Required"}</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Product name EN
              <input
                value={form.nameEn}
                onChange={(event) => updateNameEn(event.target.value)}
                placeholder="Premium travel trolley"
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Product name AR
              <input
                value={form.nameAr}
                onChange={(event) => updateForm("nameAr", event.target.value)}
                placeholder="Arabic product name"
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Product URL slug
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  updateForm("slug", slugify(event.target.value));
                }}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="premium-travel-trolley"
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Main SKU
              <input
                value={form.sku}
                onChange={(event) => updateForm("sku", event.target.value)}
                placeholder="BB-DXB-1001"
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Brand
              <input
                value={form.brand}
                onChange={(event) => updateForm("brand", event.target.value)}
                placeholder="Best Mart"
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Category
              <select
                value={form.categoryId}
                onChange={(event) => updateForm("categoryId", event.target.value)}
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {locale === "ar" ? category.nameAr : category.nameEn}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-md border border-neutral-200 bg-paper p-3 text-sm sm:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-navy">Size options for {currentCategoryName}</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    These presets update when the category changes. Custom size is also available in each stock row.
                  </p>
                </div>
                <Badge tone={sizeRequired ? "gold" : "neutral"}>{sizeRequired ? "Size required" : "One size"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <span
                    key={size.key}
                    className="inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-3 text-xs font-bold text-navy"
                  >
                    {locale === "ar" ? size.nameAr : size.nameEn}
                  </span>
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
              Subcategory / collection key
              <input
                value={form.subcategoryId}
                onChange={(event) => updateForm("subcategoryId", event.target.value)}
                placeholder="dubai-deals"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">SEO</p>
            <h2 className="mt-1 text-xl font-bold text-navy">Search and sharing metadata</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Optional product-specific title, description, and image for Google and social sharing.
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Meta title EN
              <input
                value={form.metaTitleEn}
                onChange={(event) => updateForm("metaTitleEn", event.target.value)}
                placeholder={form.nameEn || "SEO title"}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Meta title AR
              <input
                value={form.metaTitleAr}
                onChange={(event) => updateForm("metaTitleAr", event.target.value)}
                placeholder={form.nameAr || "Arabic SEO title"}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
              Meta description EN
              <textarea
                rows={3}
                value={form.metaDescriptionEn}
                onChange={(event) => updateForm("metaDescriptionEn", event.target.value)}
                placeholder="Short search result description."
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
              Meta description AR
              <textarea
                rows={3}
                value={form.metaDescriptionAr}
                onChange={(event) => updateForm("metaDescriptionAr", event.target.value)}
                placeholder="Arabic search result description."
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
            <div className="sm:col-span-2">
              <AdminImageUploadField
                label="Product social image"
                value={form.ogImage}
                onChange={(value) => updateForm("ogImage", value)}
                previewAlt={form.metaTitleEn || form.nameEn || "Product social image"}
                aspectClassName="aspect-[16/9]"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 2</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Pricing and product copy</h2>
              <p className="mt-1 text-sm text-neutral-600">AED pricing, base stock, tags, and bilingual descriptions.</p>
            </div>
            <Badge tone={isPricingReady ? "green" : "gold"}>{isPricingReady ? "Ready" : "Needs stock"}</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Selling price AED
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Compare at AED
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.comparePrice}
                onChange={(event) => updateForm("comparePrice", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Base stock
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateForm("stock", event.target.value)}
                required
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-3">
              Tags
              <input
                value={form.tags}
                onChange={(event) => updateForm("tags", event.target.value)}
                placeholder="featured, dubai, sale"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-3">
              Description EN
              <textarea
                rows={4}
                value={form.descriptionEn}
                onChange={(event) => updateForm("descriptionEn", event.target.value)}
                placeholder="Short selling description for the product page."
                required
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-3">
              Description AR
              <textarea
                rows={4}
                value={form.descriptionAr}
                onChange={(event) => updateForm("descriptionAr", event.target.value)}
                placeholder="Arabic product description"
                required
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 3</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Product media</h2>
              <p className="mt-1 text-sm text-neutral-600">The first image becomes the product card image.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addImage}>
              <Plus size={15} />
              Add image
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            <AdminMediaUploadField
              label="Short product video"
              value={form.shortVideoUrl}
              onChange={(value) => updateForm("shortVideoUrl", value)}
              previewAlt={form.nameEn || "Product video"}
              aspectClassName="aspect-video"
              acceptVideo
              acceptImage={false}
            />
            <p className="-mt-2 text-xs font-semibold text-neutral-500">
              Optional. Upload a short MP4/WebM/MOV clip for the product details page.
            </p>
            {form.images.map((image, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-neutral-200 p-3">
                <AdminImageUploadField
                  label={index === 0 ? "Main product image" : `Gallery image ${index + 1}`}
                  value={image.url}
                  onChange={(value) => updateImage(index, "url", value)}
                  onUploadMany={addUploadedImages}
                  previewAlt={image.alt || form.nameEn}
                  aspectClassName="aspect-[4/3]"
                  multiple
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <input
                    value={image.alt}
                    onChange={(event) => updateImage(index, "alt", event.target.value)}
                    placeholder="Alt text"
                    className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    value={image.sortOrder}
                    onChange={(event) => updateImage(index, "sortOrder", event.target.value)}
                    aria-label="Image sort order"
                    className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                    aria-label="Remove image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 4</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Color and size stock rows</h2>
              <p className="mt-1 text-sm text-neutral-600">Each row can control one color, size, image, SKU, and stock quantity.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              <Plus size={15} />
              Add stock row
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            {form.variants.length ? (
              form.variants.map((variant, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-neutral-200 p-3">
                  <AdminImageUploadField
                    label={`${variant.colorNameEn || "Color"} image`}
                    value={variant.imageUrl}
                    onChange={(value) => updateVariant(index, "imageUrl", value)}
                    previewAlt={`${form.nameEn || "Product"} ${variant.colorNameEn || "color"}`}
                    aspectClassName="aspect-square"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
                    <input
                      value={variant.colorNameEn}
                      onChange={(event) => updateVariant(index, "colorNameEn", event.target.value)}
                      placeholder="Color EN, e.g. Black"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <input
                      value={variant.colorNameAr}
                      onChange={(event) => updateVariant(index, "colorNameAr", event.target.value)}
                      placeholder="Color AR"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <label className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-paper px-2">
                      <span
                        className="h-5 w-5 rounded-full border border-neutral-300"
                        style={{ backgroundColor: variant.colorHex || "#ffffff" }}
                      />
                      <input
                        type="color"
                        value={variant.colorHex || "#000000"}
                        onChange={(event) => updateVariant(index, "colorHex", event.target.value)}
                        aria-label="Color"
                        className="h-7 w-10 cursor-pointer bg-transparent"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3 sm:grid-cols-[180px_1fr_1fr]">
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                      Size preset
                      <select
                        value={sizeOptions.some((size) => size.key === variant.sizeKey) ? variant.sizeKey : customSizeValue}
                        onChange={(event) => updateVariantSize(index, event.target.value)}
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                      >
                        {sizeOptions.map((size) => (
                          <option key={size.key} value={size.key}>
                            {locale === "ar" ? size.nameAr : size.nameEn}
                          </option>
                        ))}
                        <option value={customSizeValue}>Custom size</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                      Size EN
                      <input
                        value={variant.sizeNameEn}
                        onChange={(event) => updateVariant(index, "sizeNameEn", event.target.value)}
                        placeholder="M, EU 42, 100 ml"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                      Size AR
                      <input
                        value={variant.sizeNameAr}
                        onChange={(event) => updateVariant(index, "sizeNameAr", event.target.value)}
                        placeholder="Arabic size"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                      />
                    </label>
                  </div>
                  {isFashionCategory ? (
                    <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3 sm:grid-cols-2">
                      <input
                        value={variant.styleNameEn}
                        onChange={(event) => updateVariant(index, "styleNameEn", event.target.value)}
                        placeholder="Style EN, e.g. Open front"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                      />
                      <input
                        value={variant.styleNameAr}
                        onChange={(event) => updateVariant(index, "styleNameAr", event.target.value)}
                        placeholder="Style AR"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                      />
                      <input
                        value={variant.fitNameEn}
                        onChange={(event) => updateVariant(index, "fitNameEn", event.target.value)}
                        placeholder="Fit EN, e.g. Relaxed"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                      />
                      <input
                        value={variant.fitNameAr}
                        onChange={(event) => updateVariant(index, "fitNameAr", event.target.value)}
                        placeholder="Fit AR"
                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto_auto]">
                    <input
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, "sku", event.target.value)}
                      placeholder="Variant SKU"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(event) => updateVariant(index, "stock", event.target.value)}
                      placeholder="Stock"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.sortOrder}
                      onChange={(event) => updateVariant(index, "sortOrder", event.target.value)}
                      aria-label="Variant sort order"
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                    <label className="flex h-10 items-center gap-2 text-sm font-semibold text-navy">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(event) => updateVariant(index, "isActive", event.target.checked)}
                        className="accent-gold-500"
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                      aria-label="Remove color"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-neutral-200 bg-paper p-4 text-sm font-semibold text-neutral-500">
                No variant rows yet. Add rows when the product has color, size, or stock-specific options.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 5</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Fashion and custom fields</h2>
              <p className="mt-1 text-sm text-neutral-600">Category-driven fields for fabric, fit details, and client-added product data.</p>
            </div>
            <Badge tone={isFashionCategory ? "blue" : "neutral"}>
              {isFashionCategory ? "Women's Fashion" : "General"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4">
            {isFashionCategory ? (
              <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-4">
                <div>
                  <h3 className="text-sm font-bold text-navy">Fashion core fields</h3>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    These appear automatically for Women&apos;s Fashion categories.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fashionCoreFields.map((field) =>
                    field.type === "boolean" ? (
                      <label
                        key={field.key}
                        className="flex h-11 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-navy"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(form.fashionFields[field.key])}
                          onChange={(event) => updateFashionField(field.key, event.target.checked)}
                          className="accent-gold-500"
                        />
                        {locale === "ar" ? field.labelAr : field.labelEn}
                      </label>
                    ) : (
                      <label key={field.key} className="grid gap-2 text-sm font-semibold text-navy">
                        {locale === "ar" ? field.labelAr : field.labelEn}
                        <input
                          value={String(form.fashionFields[field.key] ?? "")}
                          onChange={(event) => updateFashionField(field.key, event.target.value)}
                          placeholder={field.labelEn}
                          className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                        />
                      </label>
                    )
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-neutral-200 bg-paper p-4 text-sm font-semibold text-neutral-500">
                Select a Women&apos;s Fashion category to show fabric, occasion, season, care, style, and fit controls.
              </p>
            )}

            <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-4">
              <div>
                <h3 className="text-sm font-bold text-navy">Custom fields</h3>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  These fields come from the selected category editor.
                </p>
              </div>
              {categoryCustomFields.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoryCustomFields.map((field) =>
                    field.type === "TEXTAREA" ? (
                      <label key={field.id} className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                        {locale === "ar" ? field.labelAr : field.labelEn}
                        <textarea
                          rows={3}
                          value={form.customFieldValues[field.id] ?? ""}
                          onChange={(event) => updateCustomFieldValue(field.id, event.target.value)}
                          required={field.required}
                          className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
                        />
                      </label>
                    ) : (
                      <label key={field.id} className="grid gap-2 text-sm font-semibold text-navy">
                        {locale === "ar" ? field.labelAr : field.labelEn}
                        <input
                          type={field.type === "NUMBER" ? "number" : "text"}
                          value={form.customFieldValues[field.id] ?? ""}
                          onChange={(event) => updateCustomFieldValue(field.id, event.target.value)}
                          required={field.required}
                          className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                        />
                      </label>
                    )
                  )}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-500">
                  No custom fields for this category yet. Add them from Category editor.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 6</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Specifications and publishing</h2>
              <p className="mt-1 text-sm text-neutral-600">Optional product facts plus active and featured controls.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addSpecification}>
              <Plus size={15} />
              Add spec
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            {form.specifications.map((specification, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-neutral-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["keyEn", "Key EN"],
                    ["keyAr", "Key AR"],
                    ["valueEn", "Value EN"],
                    ["valueAr", "Value AR"]
                  ].map(([key, label]) => (
                    <input
                      key={key}
                      value={specification[key as keyof ProductSpecificationForm]}
                      onChange={(event) =>
                        updateSpecification(index, key as keyof ProductSpecificationForm, event.target.value)
                      }
                      placeholder={label}
                      className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <input
                    type="number"
                    min="0"
                    value={specification.sortOrder}
                    onChange={(event) => updateSpecification(index, "sortOrder", event.target.value)}
                    aria-label="Specification sort order"
                    className="h-10 w-24 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                    aria-label="Remove specification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-4 text-sm font-semibold text-navy sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateForm("isActive", event.target.checked)}
                  className="accent-gold-500"
                />
                Active on storefront
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateForm("isFeatured", event.target.checked)}
                  className="accent-gold-500"
                />
                Featured product
              </label>
            </div>
          </div>
        </section>
      </form>

      <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Create product</p>
            <h2 className="mt-1 text-lg font-bold text-navy">Launch checklist</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Complete the required items before publishing.
            </p>
          </div>
          <Badge tone={isReadyForSale ? "green" : "gold"}>{isReadyForSale ? "Ready" : "Draft"}</Badge>
        </div>

        <div className="mt-4 grid gap-2">
          {readiness.map((item) => {
            const Icon = item.icon;
            const StatusIcon = item.ready ? CheckCircle2 : CircleAlert;

            return (
              <div key={item.label} className="rounded-md border border-neutral-200 bg-paper p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon size={16} className="shrink-0 text-gold-700" />
                    <span className="truncate text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                      {item.label}
                    </span>
                  </div>
                  <StatusIcon size={15} className={item.ready ? "shrink-0 text-emerald-600" : "shrink-0 text-gold-700"} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-navy" title={item.value}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button type="button" variant="secondary" size="sm" className="px-2" onClick={addImage}>
            <ImagePlus size={15} />
            Image
          </Button>
          <Button type="button" variant="secondary" size="sm" className="px-2" onClick={addVariant}>
            <Palette size={15} />
            Stock
          </Button>
          <Button type="button" variant="secondary" size="sm" className="px-2" onClick={addSpecification}>
            <PackageCheck size={15} />
            Spec
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <Button type="submit" form="create-product-form" disabled={saving || categories.length === 0}>
            {saving ? "Saving..." : "Create product"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            <RotateCcw size={16} />
            Reset form
          </Button>
          <Link
            href={productsHref}
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-200 px-5 text-sm font-semibold text-navy hover:bg-paper"
          >
            Back to products
          </Link>
        </div>
      </aside>
    </div>
  );
}
