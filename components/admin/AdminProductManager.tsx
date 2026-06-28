"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  Edit,
  Eye,
  ImagePlus,
  PackageCheck,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Store,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
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
import { fallbackProductImage, safeRemoteImage } from "@/lib/images";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getCategorySizeOptions, isSingleDefaultSize, type ProductSizeOption } from "@/lib/product-size-presets";
import { safeResponseJson } from "@/lib/safe-json";
import { formatCurrency } from "@/utils/currency";

export type AdminProductCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  productType: ProductType;
  customFields: CategoryCustomField[];
};

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

export type AdminProductRow = {
  id: string;
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
  categoryNameEn: string;
  categoryNameAr: string;
  subcategoryId: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string;
  brand: string;
  tags: string[];
  fashionFields: FashionFields;
  customFieldValues: Record<string, string | boolean>;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImageForm[];
  variants: ProductVariantForm[];
  specifications: ProductSpecificationForm[];
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

type AdminProductManagerProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories: AdminProductCategory[];
  products: AdminProductRow[];
  saveLabel: string;
  createHref: string;
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

function fromProduct(product: AdminProductRow): ProductForm {
  return {
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr,
    metaTitleEn: product.metaTitleEn,
    metaTitleAr: product.metaTitleAr,
    metaDescriptionEn: product.metaDescriptionEn,
    metaDescriptionAr: product.metaDescriptionAr,
    ogImage: product.ogImage,
    shortVideoUrl: product.shortVideoUrl,
    slug: product.slug,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    price: String(product.price),
    comparePrice: product.comparePrice == null ? "" : String(product.comparePrice),
    stock: String(product.stock),
    sku: product.sku,
    brand: product.brand,
    tags: product.tags.join(", "),
    fashionFields: product.fashionFields,
    customFieldValues: Object.fromEntries(
      Object.entries(product.customFieldValues).map(([key, value]) => [key, typeof value === "boolean" ? String(value) : value])
    ),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    images: product.images.length ? product.images : [{ url: "", alt: "", sortOrder: "0" }],
    variants: product.variants,
    specifications: product.specifications
  };
}

function getProductName(product: AdminProductRow, locale: Locale) {
  return locale === "ar" ? product.nameAr : product.nameEn;
}

function getCategoryName(product: AdminProductRow, locale: Locale) {
  return locale === "ar" ? product.categoryNameAr : product.categoryNameEn;
}

const customSizeValue = "__custom__";

function sizeFields(size?: ProductSizeOption) {
  return {
    sizeKey: size?.key ?? "",
    sizeNameEn: size?.nameEn ?? "",
    sizeNameAr: size?.nameAr ?? ""
  };
}

export function AdminProductManager({
  locale,
  dictionary,
  categories,
  products,
  saveLabel,
  createHref
}: AdminProductManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<ProductForm>(() => createEmptyForm(categories[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId),
    [products, selectedId]
  );
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = query
        ? [
            product.nameEn,
            product.nameAr,
            product.sku,
            product.brand,
            product.categoryNameEn,
            product.categoryNameAr
          ].some((value) => value.toLowerCase().includes(query))
        : true;
      const matchesCategory = productCategory ? product.categoryId === productCategory : true;
      const matchesStatus =
        productStatus === "active"
          ? product.isActive
          : productStatus === "inactive"
            ? !product.isActive
            : productStatus === "featured"
              ? product.isFeatured
              : productStatus === "low-stock"
                ? product.stock <= 10
                : true;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [productCategory, productSearch, productStatus, products]);
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
  const mainImage = form.images.find((image) => image.url.trim());
  const activeVariants = form.variants.filter((variant) => variant.isActive && variant.colorNameEn.trim());
  const activeVariantCount = activeVariants.length;
  const variantStock = activeVariants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
  const baseStock = Number(form.stock || 0);
  const effectiveStock = form.variants.length ? variantStock : baseStock;
  const isCatalogReady = Boolean(
    form.nameEn.trim() && form.nameAr.trim() && form.slug.trim() && form.sku.trim() && form.categoryId
  );
  const isPricingReady = Number(form.price || 0) > 0 && effectiveStock > 0;
  const isMediaReady = Boolean(mainImage);
  const isVariantSetupReady = form.variants.every(
    (variant) =>
      (!variant.colorNameEn.trim() && !variant.colorNameAr.trim()) ||
      (variant.colorNameEn.trim() &&
        variant.colorNameAr.trim() &&
        (!sizeRequired || variant.sizeNameEn.trim() || variant.sizeNameAr.trim()))
  );
  const isReadyForSale = isCatalogReady && isPricingReady && isMediaReady && isVariantSetupReady && form.isActive;
  const editorTitle = selectedProduct ? "Edit ecommerce product" : "Product workspace";
  const editorSubtitle = selectedProduct
    ? `Updating ${selectedProduct.nameEn}`
    : "Select a product to edit, or open the dedicated add product page.";
  const productReadiness: { label: string; value: string; ready: boolean; icon: LucideIcon }[] = [
    {
      label: "Catalog",
      value: isCatalogReady ? currentCategoryName : "Name, SKU, slug, category",
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
      value: isMediaReady ? `${form.images.filter((image) => image.url.trim()).length} image ready` : "Main image needed",
      ready: isMediaReady,
      icon: ImagePlus
    },
    {
      label: "Variants",
      value: activeVariantCount ? `${activeVariantCount} stock row${activeVariantCount > 1 ? "s" : ""}` : "Optional color/size stock",
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

  const startEdit = (product: AdminProductRow) => {
    setSelectedId(product.id);
    setForm(fromProduct(product));
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
      images: current.images.filter((_, imageIndex) => imageIndex !== index)
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
    const endpoint = selectedId ? `/api/admin/products/${selectedId}` : "/api/admin/products";

    try {
      const response = await fetch(endpoint, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save product.");
      }

      toast.success(selectedId ? "Product updated" : "Product created");
      if (!selectedId) {
        setForm(createEmptyForm(categories[0]?.id ?? ""));
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const duplicateProduct = async (productId: string) => {
    setDuplicatingId(productId);

    try {
      const response = await fetch(`/api/admin/products/duplicate/${productId}`, {
        method: "POST"
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to duplicate product.");
      }

      toast.success("Product duplicated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to duplicate product.");
    } finally {
      setDuplicatingId("");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_540px]">
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
        <div className="grid gap-3 border-b border-neutral-200 p-4 lg:grid-cols-[1fr_180px_160px]">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search products, SKU, brand"
              className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm font-medium text-neutral-700 rtl:pl-3 rtl:pr-10"
            />
          </label>
          <select
            value={productCategory}
            onChange={(event) => setProductCategory(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {locale === "ar" ? category.nameAr : category.nameEn}
              </option>
            ))}
          </select>
          <select
            value={productStatus}
            onChange={(event) => setProductStatus(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
            <option value="low-stock">Low stock</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-md bg-neutral-100">
                        <Image
                          src={safeRemoteImage(product.images[0]?.url, fallbackProductImage)}
                          alt={product.images[0]?.alt || product.nameEn}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-navy">{getProductName(product, locale)}</p>
                        <p className="text-xs text-neutral-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{getCategoryName(product, locale)}</td>
                  <td className="px-5 py-4 font-bold text-navy">
                    {formatCurrency(product.price, "AED", locale)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={product.stock <= 10 ? "red" : "green"}>{product.stock}</Badge>
                    {product.variants.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.variants.map((variant) => (
                          <span
                            key={`${product.id}-${variant.colorNameEn}-${variant.sortOrder}`}
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-neutral-200 px-1 text-[10px] font-bold text-navy"
                            title={`${variant.colorNameEn}: ${variant.stock}`}
                          >
                            <span
                              className="h-3 w-3 rounded-full border border-neutral-200"
                              style={{ backgroundColor: variant.colorHex || "#ffffff" }}
                            />
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={product.isActive ? "green" : "red"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {product.isFeatured ? <Badge tone="gold">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/${locale}/product/${product.slug}`}
                        className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
                        aria-label={dictionary.actions.preview}
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
                        aria-label={`Edit ${product.nameEn}`}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateProduct(product.id)}
                        disabled={duplicatingId === product.id}
                        className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 disabled:opacity-60"
                        aria-label={`Duplicate ${product.nameEn}`}
                      >
                        <Copy size={15} />
                      </button>
                      <AdminDeleteButton
                        endpoint={`/api/admin/products/${product.id}`}
                        label={`Delete product ${product.nameEn}?`}
                        successMessage="Product deleted"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-neutral-500">
                    No products match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside id="product-editor" className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Store catalog</p>
            <h2 className="mt-1 text-lg font-bold text-navy">{editorTitle}</h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {editorSubtitle}
            </p>
          </div>
          <Link
            href={createHref}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gold-200 bg-white px-3 text-sm font-semibold text-navy transition hover:border-gold-400 hover:bg-gold-50"
          >
            <Plus size={15} />
            Add
          </Link>
        </div>

        {selectedProduct ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {productReadiness.map((item) => {
                const Icon = item.icon;
                const StatusIcon = item.ready ? CheckCircle2 : CircleAlert;

                return (
                  <div key={item.label} className="rounded-md border border-neutral-200 bg-paper p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Icon size={16} className="text-gold-700" />
                      <StatusIcon size={15} className={item.ready ? "text-emerald-600" : "text-gold-700"} />
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">{item.label}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-navy" title={item.value}>
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-md border border-neutral-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-navy">Product setup</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    {form.variants.length
                      ? `Stock is controlled by variant rows (${variantStock} pcs total).`
                      : "Use base stock, or add color/size rows for variant stock."}
                  </p>
                </div>
                <Badge tone={isReadyForSale ? "green" : "gold"}>{isReadyForSale ? "Ready" : "Draft"}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={addImage}>
                  <ImagePlus size={15} />
                  Image
                </Button>
                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={addVariant}>
                  <Palette size={15} />
                  Stock
                </Button>
                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={addSpecification}>
                  <PackageCheck size={15} />
                  Spec
                </Button>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-4">
              <details open className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">1. Catalog identity</summary>
              <div className="mt-4 grid gap-4">
              {[
                ["sku", "Product code", "BM-ABAYA-1001"],
                ["nameEn", "Product name EN", "Premium travel trolley"],
                ["nameAr", "Product name AR", "Arabic product name"],
                ["slug", "Product URL slug", "premium-travel-trolley"],
                ["brand", "Brand", "Best Mart"]
              ].map(([key, label, placeholder]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    value={form[key as keyof ProductForm] as string}
                    onChange={(event) => updateForm(key as keyof ProductForm, event.target.value as never)}
                    placeholder={placeholder}
                    required
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                  />
                </label>
              ))}
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
              <div className="rounded-md border border-neutral-200 bg-paper p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-navy">Size options for {currentCategoryName}</p>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">Used by variant stock rows.</p>
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
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Subcategory / collection key
                <input
                  value={form.subcategoryId}
                  onChange={(event) => updateForm("subcategoryId", event.target.value)}
                  placeholder="dubai-deals"
                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["price", "Selling price AED", "0.01"],
                  ["comparePrice", "Compare at AED", "0.01"],
                  ["stock", "Base stock", "1"]
                ].map(([key, label, step]) => (
                  <label key={key} className="grid gap-2 text-sm font-semibold text-navy">
                    {label}
                    <input
                      type="number"
                      min="0"
                      step={step}
                      value={form[key as keyof ProductForm] as string}
                      onChange={(event) => updateForm(key as keyof ProductForm, event.target.value as never)}
                      required={key !== "comparePrice"}
                      className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                    />
                  </label>
                ))}
              </div>
              <label className="grid gap-2 text-sm font-semibold text-navy">
                Tags
                <input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="featured, dubai, sale"
                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-navy">
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
              <label className="grid gap-2 text-sm font-semibold text-navy">
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
              </details>

              <details open className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">2. Product media</summary>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-navy">Gallery images</h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">First image appears on product cards.</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addImage}>
                    <Plus size={15} />
                    Add image
                  </Button>
                </div>
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
                      label={`Image ${index + 1}`}
                      value={image.url}
                      onChange={(value) => updateImage(index, "url", value)}
                      onUploadMany={addUploadedImages}
                      previewAlt={image.alt || form.nameEn}
                      aspectClassName="aspect-[4/3]"
                      multiple
                    />
                    <div className="grid gap-3 sm:grid-cols-[1fr_96px_auto]">
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
              </details>

              <details open className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">3. Color, size, and stock rows</summary>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-navy">Variant stock rows</h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      Add each color and size combination with its own image, SKU, and stock quantity.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                    <Plus size={15} />
                    Add row
                  </Button>
                </div>
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
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_92px]">
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
                            className="h-7 w-10 cursor-pointer bg-transparent"
                            aria-label="Color"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3">
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
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={variant.sizeNameEn}
                            onChange={(event) => updateVariant(index, "sizeNameEn", event.target.value)}
                            placeholder="Size EN, e.g. M"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                          <input
                            value={variant.sizeNameAr}
                            onChange={(event) => updateVariant(index, "sizeNameAr", event.target.value)}
                            placeholder="Size AR"
                            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                          />
                        </div>
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
                      <div className="grid gap-3 sm:grid-cols-[1fr_96px_96px_auto_auto]">
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
                          aria-label="Sort order"
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
                  <p className="rounded-md border border-dashed border-neutral-200 bg-paper p-3 text-sm font-semibold text-neutral-500">
                    Add rows when this product has color, size, or stock-specific options. Customers will see matching images and size choices on the product page.
                  </p>
                )}
              </div>
              </details>

              <details className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">4. Fashion and custom fields</summary>
                <div className="mt-4 grid gap-3">
                  {isFashionCategory ? (
                    <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3">
                      <div>
                        <h3 className="text-sm font-bold text-navy">Fashion core fields</h3>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">
                          Fabric, occasion, season, care, and halal badge appear for Women&apos;s Fashion categories.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {fashionCoreFields.map((field) =>
                          field.type === "boolean" ? (
                            <label
                              key={field.key}
                              className="flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-navy"
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
                                className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                              />
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-neutral-200 bg-paper p-3 text-sm font-semibold text-neutral-500">
                      Select a Women&apos;s Fashion category to show fashion core fields.
                    </p>
                  )}

                  <div className="grid gap-3 rounded-md border border-neutral-200 bg-paper p-3">
                    <div>
                      <h3 className="text-sm font-bold text-navy">Custom fields</h3>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        These inputs are controlled from the selected category.
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
                                className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                              />
                            </label>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-500">
                        No custom fields for this category yet.
                      </p>
                    )}
                  </div>
                </div>
              </details>

              <details className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">5. Product specifications</summary>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-navy">Specifications</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={addSpecification}>
                    <Plus size={15} />
                    Add spec
                  </Button>
                </div>
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
              </div>
              </details>

              <details className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">6. SEO and product schema</summary>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold text-navy">
                      Meta title EN
                      <input
                        value={form.metaTitleEn}
                        onChange={(event) => updateForm("metaTitleEn", event.target.value)}
                        placeholder={form.nameEn || "SEO title"}
                        className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-navy">
                      Meta title AR
                      <input
                        value={form.metaTitleAr}
                        onChange={(event) => updateForm("metaTitleAr", event.target.value)}
                        placeholder={form.nameAr || "Arabic SEO title"}
                        className="h-10 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                      />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-semibold text-navy">
                    Meta description EN
                    <textarea
                      rows={3}
                      value={form.metaDescriptionEn}
                      onChange={(event) => updateForm("metaDescriptionEn", event.target.value)}
                      placeholder="Short search result description."
                      className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-navy">
                    Meta description AR
                    <textarea
                      rows={3}
                      value={form.metaDescriptionAr}
                      onChange={(event) => updateForm("metaDescriptionAr", event.target.value)}
                      placeholder="Arabic search result description."
                      className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm"
                    />
                  </label>
                  <AdminImageUploadField
                    label="Product social image"
                    value={form.ogImage}
                    onChange={(value) => updateForm("ogImage", value)}
                    previewAlt={form.metaTitleEn || form.nameEn || "Product social image"}
                    aspectClassName="aspect-[16/9]"
                  />
                </div>
              </details>

              <details open className="rounded-lg border border-neutral-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">7. Storefront publishing</summary>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold text-navy">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => updateForm("isActive", event.target.checked)}
                    className="accent-gold-500"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) => updateForm("isFeatured", event.target.checked)}
                    className="accent-gold-500"
                  />
                  Featured
                </label>
              </div>
              </details>
              <div className="grid grid-cols-2 gap-3">
                <Button type="submit" disabled={saving || categories.length === 0}>
                  {saving ? "Saving..." : saveLabel}
                </Button>
                <Button type="button" variant="secondary" onClick={() => startEdit(selectedProduct)}>
                  <RotateCcw size={16} />
                  Reset
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-md border border-neutral-200 bg-paper p-4">
              <p className="text-sm font-bold text-navy">Add product is now a dedicated page.</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Use the professional create workflow for images, category-wise sizes, color/size stock, pricing, and publishing.
              </p>
            </div>
            <Link
              href={createHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
            >
              <Plus size={17} />
              Add ecommerce product
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Edit products</p>
              <p className="mt-2 text-sm text-neutral-600">
                Click the edit icon beside any product to open its editor here.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
