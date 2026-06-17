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
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

type QuickColorForm = {
  id: string;
  nameEn: string;
  nameAr: string;
  colorHex: string;
  imageUrl: string;
  sku: string;
  sizeStock: Record<string, string>;
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
    brand: "Best Mart",
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
const quickColors = [
  { nameEn: "Black", nameAr: "Black", colorHex: "#111827" },
  { nameEn: "Maroon", nameAr: "Maroon", colorHex: "#7f1d1d" },
  { nameEn: "Red", nameAr: "Red", colorHex: "#dc2626" },
  { nameEn: "Rose", nameAr: "Rose", colorHex: "#f43f5e" },
  { nameEn: "Pink", nameAr: "Pink", colorHex: "#ec4899" },
  { nameEn: "Purple", nameAr: "Purple", colorHex: "#7c3aed" },
  { nameEn: "Blue", nameAr: "Blue", colorHex: "#2563eb" },
  { nameEn: "Sky Blue", nameAr: "Sky Blue", colorHex: "#38bdf8" },
  { nameEn: "Gold", nameAr: "Gold", colorHex: "#d4af37" },
  { nameEn: "Silver", nameAr: "Silver", colorHex: "#cbd5e1" },
  { nameEn: "Grey", nameAr: "Grey", colorHex: "#6b7280" },
  { nameEn: "White", nameAr: "White", colorHex: "#ffffff" },
  { nameEn: "Navy", nameAr: "Navy", colorHex: "#1e3a8a" },
  { nameEn: "Beige", nameAr: "Beige", colorHex: "#d6c4a3" },
  { nameEn: "Brown", nameAr: "Brown", colorHex: "#92400e" },
  { nameEn: "Olive", nameAr: "Olive", colorHex: "#556b2f" },
  { nameEn: "Green", nameAr: "Green", colorHex: "#16a34a" },
  { nameEn: "Orange", nameAr: "Orange", colorHex: "#f97316" },
  { nameEn: "Yellow", nameAr: "Yellow", colorHex: "#facc15" }
];

const optionalSpecPresets = [
  { keyEn: "Material", keyAr: "الخامة", valueEn: "", valueAr: "" },
  { keyEn: "Country of origin", keyAr: "بلد المنشأ", valueEn: "", valueAr: "" },
  { keyEn: "Package includes", keyAr: "محتويات العبوة", valueEn: "", valueAr: "" },
  { keyEn: "Warranty", keyAr: "الضمان", valueEn: "", valueAr: "" },
  { keyEn: "Delivery note", keyAr: "ملاحظة التوصيل", valueEn: "", valueAr: "" },
  { keyEn: "Return policy", keyAr: "سياسة الإرجاع", valueEn: "", valueAr: "" }
];

function createQuickColor(index = 0): QuickColorForm {
  return {
    id: `${Date.now()}-${index}`,
    nameEn: index === 0 ? "Black" : "",
    nameAr: index === 0 ? "Black" : "",
    colorHex: index === 0 ? "#111827" : "#000000",
    imageUrl: "",
    sku: "",
    sizeStock: {}
  };
}

function normalizeHexColor(value: string, fallback = "#111827") {
  const trimmed = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }

  return fallback;
}

function sizeFields(size?: ProductSizeOption) {
  return {
    sizeKey: size?.key ?? "",
    sizeNameEn: size?.nameEn ?? "",
    sizeNameAr: size?.nameAr ?? ""
  };
}

function safeJsonClone<T>(value: T, fallback: T) {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return fallback;
  }
}

export function AdminProductCreateForm({ locale, categories, productsHref }: AdminProductCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(() => createEmptyForm(categories[0]?.id ?? ""));
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quickColorNameEn, setQuickColorNameEn] = useState("Default");
  const [quickColorNameAr, setQuickColorNameAr] = useState("Default");
  const [quickColorHex, setQuickColorHex] = useState("#111827");
  const [quickColorRows, setQuickColorRows] = useState<QuickColorForm[]>([]);
  const [quickSizeStock, setQuickSizeStock] = useState<Record<string, string>>({});
  const currentCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId),
    [categories, form.categoryId]
  );
  const currentCategoryName = currentCategory
    ? locale === "ar"
      ? currentCategory.nameAr
      : currentCategory.nameEn
    : "No category";
  const isFashionCategory = isFashionProductType(currentCategory?.productType);
  const categoryCustomFields = currentCategory?.customFields ?? [];
  const sizeOptions = useMemo(() => getCategorySizeOptions(currentCategory), [currentCategory]);
  const sizeRequired = !isSingleDefaultSize(sizeOptions);
  const activeVariants = form.variants.filter((variant) => variant.isActive && variant.colorNameEn.trim());
  const activeVariantCount = activeVariants.length;
  const variantStock = activeVariants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
  const effectiveStock = form.variants.length ? variantStock : Number(form.stock || 0);
  const imageCount = form.images.filter((image) => image.url.trim()).length;
  const mainImageUrl = form.images[0]?.url.trim() ?? "";
  const hasMainImage = Boolean(mainImageUrl);
  const isCatalogReady = Boolean(form.nameEn.trim() && form.categoryId);
  const isPricingReady = Number(form.price || 0) > 0 && effectiveStock > 0;
  const isMediaReady = imageCount > 0;
  const isVariantSetupReady = form.variants.every(
    (variant) =>
      (!variant.colorNameEn.trim() && !variant.colorNameAr.trim()) ||
      (variant.colorNameEn.trim() && (!sizeRequired || variant.sizeNameEn.trim() || variant.sizeNameAr.trim()))
  );

  const buildQuickVariantRows = useCallback(
    (colors: QuickColorForm[], baseSku: string, totalStock: string) => {
      const visibleSizes = sizeOptions.length ? sizeOptions : [{ key: "one-size", nameEn: "One Size", nameAr: "One Size" }];
      const usableColors = colors.filter((color) => color.nameEn.trim());
      const stockFallback = Number(totalStock || 0);

      return usableColors.flatMap((color, colorIndex) => {
        const quickColorKey = color.nameEn.trim().toLowerCase() || "default";
        const colorSkuBase = color.sku.trim() || baseSku.trim();
        const colorTotal = Object.values(color.sizeStock).reduce((total, value) => total + Number(value || 0), 0);
        const fallbackTotal = colorTotal || Math.floor(stockFallback / Math.max(usableColors.length, 1));
        const splitStock = visibleSizes.length ? Math.floor(fallbackTotal / visibleSizes.length) : fallbackTotal;
        const remainder = visibleSizes.length ? fallbackTotal % visibleSizes.length : 0;

        return visibleSizes.map((size, sizeIndex) => {
          const manualStock = color.sizeStock[size.key];
          const stock = manualStock !== undefined && manualStock !== ""
            ? manualStock
            : String(Math.max(0, splitStock + (sizeIndex < remainder ? 1 : 0)));

          return {
            colorNameEn: color.nameEn.trim() || "Default",
            colorNameAr: color.nameAr.trim() || color.nameEn.trim() || "Default",
            colorHex: normalizeHexColor(color.colorHex),
            ...sizeFields(size),
            styleNameEn: "",
            styleNameAr: "",
            fitNameEn: "",
            fitNameAr: "",
            imageUrl: color.imageUrl || "",
            sku: colorSkuBase
              ? `${colorSkuBase}-${quickColorKey}-${size.key}`.toUpperCase().replace(/\s+/g, "-")
              : `AUTO-${quickColorKey}-${size.key}`.toUpperCase().replace(/\s+/g, "-"),
            stock,
            sortOrder: String(colorIndex * visibleSizes.length + sizeIndex),
            isActive: true
          };
        });
      });
    },
    [sizeOptions]
  );

  useEffect(() => {
    if (!quickColorRows.length) {
      return;
    }

    setForm((current) => {
      const rows = buildQuickVariantRows(quickColorRows, current.sku, current.stock);
      const nextStock = String(rows.reduce((total, row) => total + Number(row.stock || 0), 0));
      const currentSignature = JSON.stringify(current.variants);
      const nextSignature = JSON.stringify(rows);

      if (currentSignature === nextSignature && current.stock === nextStock) {
        return current;
      }

      return {
        ...current,
        stock: nextStock,
        variants: rows
      };
    });
  }, [buildQuickVariantRows, quickColorRows]);
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
    setQuickColorRows([]);
    setQuickSizeStock({});
  };

  const updateQuickColorRow = (id: string, key: keyof Omit<QuickColorForm, "id" | "sizeStock">, value: string) => {
    setQuickColorRows((current) =>
      current.map((color) => (color.id === id ? { ...color, [key]: value } : color))
    );
  };

  const updateQuickColorSizeStock = (id: string, sizeKey: string, value: string) => {
    setQuickColorRows((current) =>
      current.map((color) =>
        color.id === id
          ? {
              ...color,
              sizeStock: {
                ...color.sizeStock,
                [sizeKey]: value
              }
            }
          : color
      )
    );
  };

  const addQuickColorRow = () => {
    setQuickColorRows((current) => [...current, createQuickColor(current.length)]);
  };

  const addQuickColorPreset = (preset: (typeof quickColors)[number]) => {
    setQuickColorRows((current) => {
      const exists = current.some((color) => color.nameEn.trim().toLowerCase() === preset.nameEn.toLowerCase());

      if (exists) {
        return current;
      }

      return [
        ...current,
        {
          ...createQuickColor(current.length),
          nameEn: preset.nameEn,
          nameAr: preset.nameAr,
          colorHex: preset.colorHex,
          imageUrl: ""
        }
      ];
    });
  };

  const removeQuickColorRow = (id: string) => {
    setQuickColorRows((current) => (current.length === 1 ? current : current.filter((color) => color.id !== id)));
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

  const addCategorySizeRows = () => {
    const rows = sizeOptions.map((size, index) => ({
      colorNameEn: "Default",
      colorNameAr: "Default",
      colorHex: "#111827",
      ...sizeFields(size),
      styleNameEn: "",
      styleNameAr: "",
      fitNameEn: "",
      fitNameAr: "",
      imageUrl: "",
      sku: form.sku ? `${form.sku}-${size.key}`.toUpperCase() : "",
      stock: "0",
      sortOrder: String(form.variants.length + index),
      isActive: true
    }));

    setForm((current) => ({
      ...current,
      variants: [...current.variants, ...rows]
    }));
  };

  const applyQuickStockRows = () => {
    const rows = buildQuickVariantRows(quickColorRows.length ? quickColorRows : [createQuickColor()], form.sku, form.stock);

    setForm((current) => {
      return {
        ...current,
        stock: String(rows.reduce((total, row) => total + Number(row.stock || 0), 0)),
        variants: rows.map((row, index) => ({ ...row, sortOrder: String(index) }))
      };
    });

    toast.success("Color-wise image, SKU, and size stock rows updated.");
  };

  const addCommonColorRows = () => {
    const size = sizeOptions[0];
    const rows = quickColors.map((color, index) => ({
      colorNameEn: color.nameEn,
      colorNameAr: color.nameAr,
      colorHex: color.colorHex,
      ...sizeFields(size),
      styleNameEn: "",
      styleNameAr: "",
      fitNameEn: "",
      fitNameAr: "",
      imageUrl: "",
      sku: form.sku ? `${form.sku}-${color.nameEn}`.toUpperCase().replace(/\s+/g, "-") : "",
      stock: "0",
      sortOrder: String(form.variants.length + index),
      isActive: true
    }));

    setForm((current) => ({
      ...current,
      variants: [...current.variants, ...rows]
    }));
  };

  const duplicateLastVariant = () => {
    setForm((current) => {
      const lastVariant = current.variants[current.variants.length - 1];

      if (!lastVariant) {
        return current;
      }

      return {
        ...current,
        variants: [
          ...current.variants,
          {
            ...lastVariant,
            sku: "",
            stock: "0",
            sortOrder: String(current.variants.length)
          }
        ]
      };
    });
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

  const addSpecificationPreset = (preset: (typeof optionalSpecPresets)[number]) => {
    setForm((current) => {
      const exists = current.specifications.some(
        (specification) => specification.keyEn.trim().toLowerCase() === preset.keyEn.toLowerCase()
      );

      if (exists) {
        return current;
      }

      return {
        ...current,
        specifications: [
          ...current.specifications,
          {
            ...preset,
            sortOrder: String(current.specifications.length)
          }
        ]
      };
    });
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
    const fallbackName = form.nameEn.trim();
    const fallbackSlug = form.slug.trim() || slugify(fallbackName);
    const fallbackSku =
      form.sku.trim() ||
      `BM-${(fallbackSlug || "PRODUCT").toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const fallbackDescription = form.descriptionEn.trim() || fallbackName;

    const payload = {
      nameEn: fallbackName,
      nameAr: form.nameAr.trim() || fallbackName,
      descriptionEn: fallbackDescription,
      descriptionAr: form.descriptionAr.trim() || fallbackDescription,
      metaTitleEn: form.metaTitleEn || null,
      metaTitleAr: form.metaTitleAr || null,
      metaDescriptionEn: form.metaDescriptionEn || null,
      metaDescriptionAr: form.metaDescriptionAr || null,
      ogImage: form.ogImage || null,
      shortVideoUrl: form.shortVideoUrl || null,
      slug: fallbackSlug,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock),
      sku: fallbackSku,
      brand: form.brand.trim() || "Best Mart",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      fashionFields: safeJsonClone(isFashionCategory ? form.fashionFields : { ...emptyFashionFields }, {
        ...emptyFashionFields
      }),
      customFieldValues: safeJsonClone(
        Object.fromEntries(categoryCustomFields.map((field) => [field.id, form.customFieldValues[field.id] ?? ""])),
        {}
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
        .filter((variant) => variant.colorNameEn.trim())
        .map((variant, index) => ({
          colorNameEn: variant.colorNameEn,
          colorNameAr: variant.colorNameAr || variant.colorNameEn,
          colorHex: variant.colorHex || null,
          sizeKey: variant.sizeKey || null,
          sizeNameEn: variant.sizeNameEn || null,
          sizeNameAr: variant.sizeNameAr || variant.sizeNameEn || null,
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
        body: JSON.stringify(safeJsonClone(payload, payload))
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
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <form id="create-product-form" onSubmit={submit} className="grid gap-6">
        <section className="rounded-lg border border-gold-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Quick add</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Simple product setup</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Fill only what customers see first: name, price, description, image, color, size, and stock.
              </p>
            </div>
            <Badge tone={isReadyForSale ? "green" : "gold"}>{isReadyForSale ? "Ready" : "Needs info"}</Badge>
          </div>

          <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Product name
                <input
                  value={form.nameEn}
                  onChange={(event) => updateNameEn(event.target.value)}
                  placeholder="Premium abaya / handbag / perfume"
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
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Price AED
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
                Total stock {form.variants.length ? "(auto)" : ""}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => updateForm("stock", event.target.value)}
                  required
                  readOnly={Boolean(form.variants.length)}
                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm read-only:bg-neutral-100 read-only:text-neutral-500"
                />
                <span className="text-xs font-semibold text-neutral-500">
                  {form.variants.length ? "Calculated from selected color and size stock." : "Use this only before adding color-wise stock."}
                </span>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Description
                <textarea
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(event) => updateForm("descriptionEn", event.target.value)}
                  placeholder="Short description shown on product details page."
                  className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
                />
              </label>
              <div className="grid min-w-0 gap-4 rounded-xl border border-neutral-200 bg-paper p-3 sm:col-span-2 lg:grid-cols-2">
                <AdminImageUploadField
                  label="Main product image"
                  value={form.images[0]?.url ?? ""}
                  onChange={(value) => updateImage(0, "url", value)}
                  onUploadMany={addUploadedImages}
                  previewAlt={form.nameEn || "Product image"}
                  aspectClassName="aspect-[4/3]"
                  multiple
                />
                <AdminMediaUploadField
                  label="Short video"
                  value={form.shortVideoUrl}
                  onChange={(value) => updateForm("shortVideoUrl", value)}
                  previewAlt={form.nameEn || "Product video"}
                  aspectClassName="aspect-video"
                  acceptVideo
                  acceptImage={false}
                />
              </div>
              <div className="min-w-0 rounded-xl border border-neutral-200 bg-paper p-3 sm:col-span-2 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">Step 2: Select colors, images, SKU and stock</p>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      Main image stays as product cover. Every selected color opens its own image upload, SKU code, and size-wise stock fields.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="w-full shrink-0 sm:w-auto" onClick={addQuickColorRow}>
                    <Plus size={15} />
                    Add custom color
                  </Button>
                </div>
                <div className="mt-4 grid gap-4">
                  {!hasMainImage ? (
                    <div className="rounded-xl border border-gold-200 bg-gold-50 p-3 text-xs font-semibold leading-5 text-neutral-700">
                      Step 1: upload the main product image above. You can still prepare colors now, but save needs at least one main image.
                    </div>
                  ) : null}
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">Choose visible product colors</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        If only one color is selected, product will have one color option. If multiple colors are selected, each color gets separate stock fields.
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        {quickColors.map((preset) => {
                          const selected = quickColorRows.some(
                            (color) => color.nameEn.trim().toLowerCase() === preset.nameEn.toLowerCase()
                          );

                          return (
                            <button
                              key={preset.nameEn}
                              type="button"
                              onClick={() => addQuickColorPreset(preset)}
                              className={`inline-flex h-10 min-w-0 items-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
                                selected
                                  ? "border-gold-500 bg-gold-50 text-navy ring-2 ring-gold-200"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:border-gold-300"
                              }`}
                              aria-pressed={selected}
                            >
                              <span
                                className="h-5 w-5 rounded-full border-2 border-white ring-1 ring-neutral-300"
                                style={{ backgroundColor: preset.colorHex }}
                              />
                              <span className="truncate">{preset.nameEn}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {quickColorRows.length ? (
                      quickColorRows.map((color, index) => (
                        <div key={color.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                          <div className="flex flex-col gap-3 border-b border-neutral-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className="h-9 w-9 shrink-0 rounded-full border-2 border-white ring-1 ring-neutral-300"
                                style={{ backgroundColor: normalizeHexColor(color.colorHex) }}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-navy">
                                  Color variant {index + 1}: {color.nameEn || "Custom color"}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-neutral-500">
                                  Add this color image, SKU, then fill stock by size.
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge tone="green">Auto sync</Badge>
                              <button
                                type="button"
                                onClick={() => removeQuickColorRow(color.id)}
                                disabled={quickColorRows.length === 1}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-100 px-3 text-xs font-bold text-sale transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={14} />
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="grid min-w-0 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-4">
                            <div className="grid min-w-0 gap-3">
                              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                                  Color name
                                  <input
                                    value={color.nameEn}
                                    onChange={(event) => updateQuickColorRow(color.id, "nameEn", event.target.value)}
                                    placeholder={index === 0 ? "Black" : "Maroon"}
                                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                                  />
                                </label>
                                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                                  Color code
                                  <div className="grid grid-cols-[minmax(0,1fr)_46px] gap-2">
                                    <input
                                      value={color.colorHex}
                                      onChange={(event) => updateQuickColorRow(color.id, "colorHex", event.target.value)}
                                      placeholder="#111827"
                                      className="h-11 min-w-0 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-bold normal-case tracking-normal text-navy"
                                    />
                                    <input
                                      type="color"
                                      value={normalizeHexColor(color.colorHex)}
                                      onChange={(event) => updateQuickColorRow(color.id, "colorHex", event.target.value)}
                                      aria-label="Color picker"
                                      className="h-11 w-full rounded-md border border-neutral-200 bg-paper p-1"
                                    />
                                  </div>
                                </label>
                              </div>
                              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                                SKU code for this color
                                <input
                                  value={color.sku}
                                  onChange={(event) => updateQuickColorRow(color.id, "sku", event.target.value)}
                                  placeholder={`${form.sku || "BM-PRODUCT"}-${color.nameEn || "BLACK"}`}
                                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                                />
                              </label>
                              <div className="rounded-lg border border-neutral-200 bg-paper p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">Size-wise stock</p>
                                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                                      Example: 52 = 5, 54 = 5, 56 = 10 for this color only.
                                    </p>
                                  </div>
                                  <Badge tone={sizeRequired ? "gold" : "neutral"}>{sizeRequired ? currentCategoryName : "One size"}</Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(96px,1fr))]">
                                  {sizeOptions.map((size) => (
                                    <label key={size.key} className="grid gap-1 rounded-md border border-neutral-200 bg-white p-2">
                                      <span className="truncate text-xs font-bold text-navy">{locale === "ar" ? size.nameAr : size.nameEn}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={color.sizeStock[size.key] ?? ""}
                                        onChange={(event) => updateQuickColorSizeStock(color.id, size.key, event.target.value)}
                                        placeholder="0"
                                        className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm font-bold text-navy"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 rounded-lg border border-neutral-200 bg-paper p-3">
                              <AdminImageUploadField
                                label={`${color.nameEn || `Color ${index + 1}`} image`}
                                value={color.imageUrl}
                                onChange={(value) => updateQuickColorRow(color.id, "imageUrl", value)}
                                previewAlt={`${form.nameEn || "Product"} ${color.nameEn || "color"}`}
                                aspectClassName="aspect-square"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-sm font-semibold text-neutral-500">
                        Select a preset color or click Add custom color to open the color-specific variant form.
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-xs font-bold text-green-800">
                      <CheckCircle2 size={16} />
                      Color image, SKU, and size-stock rows update automatically below.
                    </div>
                  </div>
              </div>
              {form.variants.length ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white sm:col-span-2">
                  <div className="border-b border-neutral-200 bg-paper px-3 py-2">
                    <p className="text-sm font-bold text-navy">Variant table</p>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">Color, size, stock, and auto SKU rows.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                        <tr>
                          <th className="px-3 py-2">Color</th>
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">Stock</th>
                          <th className="px-3 py-2">SKU</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {form.variants.map((variant, index) => (
                          <tr key={`${variant.colorNameEn}-${variant.sizeKey}-${index}`} className="transition hover:bg-paper">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 font-semibold text-navy">
                                <span
                                  className="h-5 w-5 rounded-full border-2 border-white ring-1 ring-neutral-200"
                                  style={{ backgroundColor: variant.colorHex || "#ffffff" }}
                                />
                                {variant.colorNameEn || "Default"}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-neutral-700">{variant.sizeNameEn || "One Size"}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(event) => updateVariant(index, "stock", event.target.value)}
                                className="h-9 w-24 rounded-md border border-neutral-200 bg-paper px-2 text-sm font-bold text-navy"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={variant.sku}
                                onChange={(event) => updateVariant(index, "sku", event.target.value)}
                                placeholder="Auto on save"
                                className="h-9 min-w-36 rounded-md border border-neutral-200 bg-paper px-2 text-xs font-semibold text-navy"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="inline-grid h-9 w-9 place-items-center rounded-md border border-red-100 text-sale transition hover:bg-red-50"
                                aria-label="Delete variant"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="hidden min-w-0 gap-4">
              <AdminImageUploadField
                label="Main product image"
                value={form.images[0]?.url ?? ""}
                onChange={(value) => updateImage(0, "url", value)}
                onUploadMany={addUploadedImages}
                previewAlt={form.nameEn || "Product image"}
                aspectClassName="aspect-[4/3]"
                multiple
              />
              <AdminMediaUploadField
                label="Short video"
                value={form.shortVideoUrl}
                onChange={(value) => updateForm("shortVideoUrl", value)}
                previewAlt={form.nameEn || "Product video"}
                aspectClassName="aspect-video"
                acceptVideo
                acceptImage={false}
              />
            </div>
          </div>

          <details className="mt-5 rounded-xl border border-neutral-200 bg-paper p-4">
            <summary className="cursor-pointer text-sm font-bold text-navy">
              Optional product details
              <span className="ml-2 text-xs font-semibold text-neutral-500">brand, Arabic, fabric, occasion, warranty, publish</span>
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Brand
                <input
                  value={form.brand}
                  onChange={(event) => updateForm("brand", event.target.value)}
                  placeholder="Best Mart"
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Compare price AED
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={(event) => updateForm("comparePrice", event.target.value)}
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Product name AR
                <input
                  value={form.nameAr}
                  onChange={(event) => updateForm("nameAr", event.target.value)}
                  placeholder="Arabic name"
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Tags
                <input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="abaya, dubai, new"
                  className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Description AR
                <textarea
                  rows={3}
                  value={form.descriptionAr}
                  onChange={(event) => updateForm("descriptionAr", event.target.value)}
                  placeholder="Arabic description"
                  className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
                />
              </label>
              {isFashionCategory ? (
                <div className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:col-span-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-bold text-navy">Product detail fields</h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      Fill only what matters. These rows show on the product details page so customers understand fabric, fit, length, care, and return notes.
                    </p>
                  </div>
                  {fashionCoreFields.map((field) =>
                    field.type === "boolean" ? (
                      <label key={field.key} className="flex h-11 items-center gap-2 text-sm font-semibold text-navy">
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
                          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                        />
                      </label>
                    )
                  )}
                </div>
              ) : null}
              <div className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-navy">Extra product facts</h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      Add any customer-facing details like package includes, warranty, origin, delivery note, or return policy.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addSpecification}>
                    <Plus size={15} />
                    Add custom fact
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {optionalSpecPresets.map((preset) => (
                    <button
                      key={preset.keyEn}
                      type="button"
                      onClick={() => addSpecificationPreset(preset)}
                      className="rounded-md border border-neutral-200 bg-paper px-3 py-2 text-xs font-bold text-neutral-700 transition hover:border-gold-300 hover:bg-gold-50"
                    >
                      + {preset.keyEn}
                    </button>
                  ))}
                </div>
                {form.specifications.length ? (
                  <div className="grid gap-3">
                    {form.specifications.map((specification, index) => (
                      <div key={index} className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={specification.keyEn}
                            onChange={(event) => updateSpecification(index, "keyEn", event.target.value)}
                            placeholder="Label EN, e.g. Warranty"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                          <input
                            value={specification.keyAr}
                            onChange={(event) => updateSpecification(index, "keyAr", event.target.value)}
                            placeholder="Label AR"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                          <input
                            value={specification.valueEn}
                            onChange={(event) => updateSpecification(index, "valueEn", event.target.value)}
                            placeholder="Value EN, e.g. 7 days exchange"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                          <input
                            value={specification.valueAr}
                            onChange={(event) => updateSpecification(index, "valueAr", event.target.value)}
                            placeholder="Value AR"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            value={specification.sortOrder}
                            onChange={(event) => updateSpecification(index, "sortOrder", event.target.value)}
                            aria-label="Specification sort order"
                            className="h-10 w-24 rounded-md border border-neutral-200 bg-white px-3 text-sm"
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
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-neutral-200 bg-paper p-3 text-sm font-semibold text-neutral-500">
                    No extra facts yet. Product can still be created without them.
                  </p>
                )}
              </div>
              <div className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 text-sm font-semibold text-navy sm:col-span-2 sm:grid-cols-2">
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
          </details>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={saving || categories.length === 0}>
              {saving ? "Saving..." : "Create product"}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              <RotateCcw size={16} />
              Reset
            </Button>
            <Link
              href={productsHref}
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-200 px-5 text-sm font-semibold text-navy hover:bg-paper"
            >
              Back to products
            </Link>
          </div>
        </section>

        <details className="hidden rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Advanced</p>
                <h2 className="mt-1 text-xl font-bold text-navy">Catalog controls</h2>
                <p className="mt-1 text-sm text-neutral-600">Open only for brand, Arabic name, slug, SKU, and category presets.</p>
              </div>
              <Badge tone="neutral">Optional</Badge>
            </div>
          </summary>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Step 1</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Basic product info</h2>
              <p className="mt-1 text-sm text-neutral-600">Start with the minimum fields. URL, SKU, Arabic copy, and collection are optional.</p>
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
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy">
              Product name AR
              <input
                value={form.nameAr}
                onChange={(event) => updateForm("nameAr", event.target.value)}
                placeholder="Arabic product name"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy">
              Product URL slug
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  updateForm("slug", slugify(event.target.value));
                }}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                placeholder="premium-travel-trolley"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy">
              Main SKU
              <input
                value={form.sku}
                onChange={(event) => updateForm("sku", event.target.value)}
                placeholder="BB-DXB-1001"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy">
              Brand
              <input
                value={form.brand}
                onChange={(event) => updateForm("brand", event.target.value)}
                placeholder="Best Mart"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Category
              <select
                value={form.categoryId}
                onChange={(event) => updateForm("categoryId", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {locale === "ar" ? category.nameAr : category.nameEn}
                  </option>
                ))}
              </select>
            </label>
            <details className="rounded-md border border-neutral-200 bg-paper p-3 sm:col-span-2">
              <summary className="cursor-pointer text-sm font-bold text-navy">
                Advanced catalog fields
                <span className="ml-2 text-xs font-semibold text-neutral-500">
                  Brand, Arabic name, URL slug, SKU, collection
                </span>
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Brand
                  <input
                    value={form.brand}
                    onChange={(event) => updateForm("brand", event.target.value)}
                    placeholder="Best Mart"
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Product name AR
                  <input
                    value={form.nameAr}
                    onChange={(event) => updateForm("nameAr", event.target.value)}
                    placeholder="Arabic product name"
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
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
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Main SKU
                  <input
                    value={form.sku}
                    onChange={(event) => updateForm("sku", event.target.value)}
                    placeholder="Auto-generated if empty"
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Subcategory / collection key
                  <input
                    value={form.subcategoryId}
                    onChange={(event) => updateForm("subcategoryId", event.target.value)}
                    placeholder="dubai-deals"
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
              </div>
            </details>
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
            <label className="hidden gap-2 text-sm font-semibold text-navy sm:col-span-2">
              Subcategory / collection key
              <input
                value={form.subcategoryId}
                onChange={(event) => updateForm("subcategoryId", event.target.value)}
                placeholder="dubai-deals"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
          </div>
        </details>

        <details className="hidden group rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Optional SEO</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Search and sharing metadata</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Hidden by default. Open only when you want custom Google/social metadata.
              </p>
            </div>
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-gold-200 bg-gold-50 px-4 text-sm font-bold text-navy group-open:hidden">
              Show SEO fields
            </span>
            <span className="hidden h-10 items-center justify-center rounded-md border border-neutral-200 bg-paper px-4 text-sm font-bold text-navy group-open:inline-flex">
              Hide SEO fields
            </span>
          </summary>
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
        </details>

        <details className="hidden rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Advanced</p>
                <h2 className="mt-1 text-xl font-bold text-navy">Extra pricing and copy</h2>
                <p className="mt-1 text-sm text-neutral-600">Open only for compare price, tags, Arabic description, or copy edits.</p>
              </div>
              <Badge tone={isPricingReady ? "green" : "gold"}>{isPricingReady ? "Ready" : "Needs stock"}</Badge>
            </div>
          </summary>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Selling price AED
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy">
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
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy sm:col-span-3">
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
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
            <label className="hidden gap-2 text-sm font-semibold text-navy sm:col-span-3">
              Description AR
              <textarea
                rows={4}
                value={form.descriptionAr}
                onChange={(event) => updateForm("descriptionAr", event.target.value)}
                placeholder="Arabic product description"
                className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
              />
            </label>
            <details className="rounded-md border border-neutral-200 bg-paper p-3 sm:col-span-3">
              <summary className="cursor-pointer text-sm font-bold text-navy">
                Advanced pricing and copy
                <span className="ml-2 text-xs font-semibold text-neutral-500">Compare price, tags, Arabic description</span>
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Compare at AED
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.comparePrice}
                    onChange={(event) => updateForm("comparePrice", event.target.value)}
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy">
                  Tags
                  <input
                    value={form.tags}
                    onChange={(event) => updateForm("tags", event.target.value)}
                    placeholder="featured, dubai, sale"
                    className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                  Description AR
                  <textarea
                    rows={4}
                    value={form.descriptionAr}
                    onChange={(event) => updateForm("descriptionAr", event.target.value)}
                    placeholder="Arabic product description"
                    className="rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm"
                  />
                </label>
              </div>
            </details>
          </div>
        </details>

        <details className="hidden rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Advanced</p>
                <h2 className="mt-1 text-xl font-bold text-navy">Gallery and media controls</h2>
                <p className="mt-1 text-sm text-neutral-600">Open only for extra gallery images, alt text, sort order, and detailed stock helper.</p>
              </div>
              <Badge tone={isMediaReady ? "green" : "gold"}>{imageCount ? `${imageCount} image${imageCount === 1 ? "" : "s"}` : "No image"}</Badge>
            </div>
          </summary>

          <div className="mt-4 flex justify-start">
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
            <div className="grid gap-4 rounded-md border border-gold-100 bg-gold-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy">Easy stock setup</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
                    Add main image/video first, then set default color and size-wise stock in one click. Advanced variants stay available below.
                  </p>
                </div>
                <Badge tone={form.variants.length ? "green" : "gold"}>
                  {form.variants.length ? `${form.variants.length} rows ready` : "No rows yet"}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px_140px]">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                  Default color EN
                  <input
                    value={quickColorNameEn}
                    onChange={(event) => setQuickColorNameEn(event.target.value)}
                    placeholder="Black"
                    className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                  />
                </label>
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                  Default color AR
                  <input
                    value={quickColorNameAr}
                    onChange={(event) => setQuickColorNameAr(event.target.value)}
                    placeholder="Arabic color"
                    className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                  />
                </label>
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                  Color
                  <input
                    type="color"
                    value={normalizeHexColor(quickColorHex)}
                    onChange={(event) => setQuickColorHex(event.target.value)}
                    className="h-10 w-full rounded-md border border-neutral-200 bg-white px-2"
                  />
                </label>
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                  Total stock
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => updateForm("stock", event.target.value)}
                    className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-navy"
                  />
                </label>
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                  Size-wise stock for {currentCategoryName}
                </p>
                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {sizeOptions.map((size) => (
                    <label key={size.key} className="grid gap-1 rounded-md border border-neutral-200 bg-white p-2">
                      <span className="text-xs font-bold text-navy">{locale === "ar" ? size.nameAr : size.nameEn}</span>
                      <input
                        type="number"
                        min="0"
                        value={quickSizeStock[size.key] ?? ""}
                        onChange={(event) =>
                          setQuickSizeStock((current) => ({
                            ...current,
                            [size.key]: event.target.value
                          }))
                        }
                        placeholder="0"
                        className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm font-bold text-navy"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs font-semibold text-neutral-500">
                  Leave size boxes empty to split total stock automatically across all sizes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={applyQuickStockRows}>
                  <PackageCheck size={15} />
                  Create default color size stock
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setQuickSizeStock({})}>
                  Clear size stock
                </Button>
              </div>
            </div>
          </div>
        </details>

        <details className="hidden group rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Advanced</p>
              <h2 className="mt-1 text-xl font-bold text-navy">More colors and product variants</h2>
              <p className="mt-1 text-sm text-neutral-600">Open only when this product needs extra color/size/image/SKU stock rows.</p>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-neutral-600 group-open:bg-gold-50 group-open:text-gold-700">
              {form.variants.length} stock row{form.variants.length === 1 ? "" : "s"}
            </span>
          </summary>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addCategorySizeRows}>
              <Plus size={15} />
              Add all sizes
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={addCommonColorRows}>
              <Palette size={15} />
              Common colors
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={duplicateLastVariant} disabled={!form.variants.length}>
              <PackageCheck size={15} />
              Duplicate row
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              <Plus size={15} />
              Add row
            </Button>
          </div>

          <div className="mt-4 grid gap-2 rounded-md border border-gold-100 bg-gold-50 p-3 text-sm text-neutral-700 sm:grid-cols-3">
            <p><strong>Add all sizes:</strong> creates one stock row per category size.</p>
            <p><strong>Common colors:</strong> starts Black, White, Navy, Beige rows.</p>
            <p><strong>Duplicate row:</strong> fastest way to add another color/size stock entry.</p>
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
                        value={normalizeHexColor(variant.colorHex || "#000000", "#000000")}
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
        </details>

        <details className="hidden group rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Advanced</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Fashion and custom fields</h2>
              <p className="mt-1 text-sm text-neutral-600">Open when this category needs fabric, fit, occasion, or custom product data.</p>
            </div>
            <Badge tone={isFashionCategory ? "blue" : "neutral"}>
              {isFashionCategory ? "Women's Fashion" : "General"}
            </Badge>
          </summary>

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
        </details>

        <section className="hidden rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Final</p>
              <h2 className="mt-1 text-xl font-bold text-navy">Specifications and publishing</h2>
              <p className="mt-1 text-sm text-neutral-600">Optional product facts plus active and featured controls.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <details className="rounded-md border border-neutral-200 bg-paper p-4">
              <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy">Optional specifications</h3>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    Add material, warranty, country, or other facts only when needed.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-600">
                  {form.specifications.length} spec{form.specifications.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="mt-4 flex justify-start">
                <Button type="button" variant="secondary" size="sm" onClick={addSpecification}>
                  <Plus size={15} />
                  Add spec
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {form.specifications.length ? (
                  form.specifications.map((specification, index) => (
                    <div key={index} className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3">
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
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-500">
                    No specifications yet. You can create the product without them.
                  </p>
                )}
              </div>
            </details>
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

      <aside className="hidden h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
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
