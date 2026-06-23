import { z } from "zod";
import { PRODUCT_TYPE_GENERAL, PRODUCT_TYPE_WOMENS_FASHION } from "@/lib/category-fields";
import { imageUrlValidationMessage, isAllowedRemoteImage } from "@/lib/images";

const nullableString = z.string().trim().optional().nullable();
const imageUrl = z.string().trim().url().refine(isAllowedRemoteImage, imageUrlValidationMessage);
const nullableImageUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((value) => !value || isAllowedRemoteImage(value), imageUrlValidationMessage);
const money = z.coerce.number().min(0);
const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const categoryCustomFieldSchema = z.object({
  id: z.string().trim().min(1),
  labelEn: z.string().trim().min(1),
  labelAr: z.string().trim().min(1),
  type: z.enum(["TEXT", "NUMBER", "TEXTAREA"]).default("TEXT"),
  required: z.boolean().default(false)
});
const fashionFieldsSchema = z.object({
  fabric: nullableString.default(""),
  material: nullableString.default(""),
  lining: nullableString.default(""),
  occasion: nullableString.default(""),
  season: nullableString.default(""),
  care: nullableString.default(""),
  fit: nullableString.default(""),
  style: nullableString.default(""),
  length: nullableString.default(""),
  closure: nullableString.default(""),
  transparency: nullableString.default(""),
  origin: nullableString.default(""),
  warranty: nullableString.default(""),
  returnNote: nullableString.default(""),
  halalBadge: z.boolean().default(false)
});
const paymentSettingsSchema = z.object({
  cod: z.object({
    enabled: z.boolean().default(true),
    displayName: z.string().trim().default("Cash on delivery"),
    instructions: z.string().trim().default("")
  }),
  stripe: z.object({
    enabled: z.boolean().default(false),
    displayName: z.string().trim().default("Card payment"),
    publishableKey: z.string().trim().default(""),
    secretKey: z.string().trim().default(""),
    webhookSecret: z.string().trim().default(""),
    mode: z.enum(["payment_element", "hosted_checkout"]).default("payment_element"),
    instructions: z.string().trim().default("")
  })
});
const courierSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["manual", "aramex", "fetchr", "dhl", "shiprocket", "other"]).default("manual"),
  displayName: z.string().trim().default("Dubai delivery partner"),
  accountNumber: z.string().trim().default(""),
  apiKey: z.string().trim().default(""),
  apiSecret: z.string().trim().default(""),
  webhookSecret: z.string().trim().default(""),
  trackingUrlTemplate: z.string().trim().default(""),
  pickupCity: z.string().trim().default("Dubai"),
  serviceLevel: z.string().trim().default("standard"),
  notes: z.string().trim().default("")
});
const themeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  paperColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  inkColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  radius: z.enum(["compact", "soft", "rounded"]),
  buttonStyle: z.enum(["gradient", "solid"]),
  productCardStyle: z.enum(["standard", "compact", "elevated"]),
  maintenanceMode: z.boolean().default(false),
  maintenanceTitleEn: z.string().trim().default("We are updating Best Mart"),
  maintenanceTitleAr: z.string().trim().default("We are updating Best Mart"),
  maintenanceMessageEn: z.string().trim().default("The store is temporarily unavailable while we improve the shopping experience. Please check back soon."),
  maintenanceMessageAr: z.string().trim().default("The store is temporarily unavailable while we improve the shopping experience. Please check back soon."),
  storefrontContent: z.object({
    navHomeEn: z.string().trim().default(""), navHomeAr: z.string().trim().default(""),
    navShopEn: z.string().trim().default(""), navShopAr: z.string().trim().default(""),
    navAccountEn: z.string().trim().default(""), navAccountAr: z.string().trim().default(""),
    footerTaglineEn: z.string().trim().default(""), footerTaglineAr: z.string().trim().default(""),
    privacyTitleEn: z.string().trim().default(""), privacyTitleAr: z.string().trim().default(""),
    privacyBodyEn: z.string().trim().default(""), privacyBodyAr: z.string().trim().default(""),
    termsTitleEn: z.string().trim().default(""), termsTitleAr: z.string().trim().default(""),
    termsBodyEn: z.string().trim().default(""), termsBodyAr: z.string().trim().default("")
  }).default({})
});
const shippingRateSchema = z.object({
  emirate: z.string().trim().min(1).optional(),
  cost: money.optional(),
  fee: money.optional(),
  freeFrom: money.optional(),
  deliveryDays: z.string().trim().min(1).optional(),
  days: z.string().trim().min(1).optional(),
  cod: z.boolean().optional(),
  codAvailable: z.boolean().optional()
});

export const categorySchema = z.object({
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentCategoryId: nullableString,
  image: nullableImageUrl,
  productType: z.enum([PRODUCT_TYPE_GENERAL, PRODUCT_TYPE_WOMENS_FASHION]).default(PRODUCT_TYPE_GENERAL),
  customFields: z.array(categoryCustomFieldSchema).default([]),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const categoryReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

export const productImageSchema = z.object({
  url: imageUrl,
  alt: nullableString,
  sortOrder: z.coerce.number().int().min(0).default(0)
});

const colorHex = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .optional()
  .nullable();

export const productVariantSchema = z.object({
  colorNameEn: z.string().trim().min(1),
  colorNameAr: z.string().trim().min(1),
  colorHex,
  sizeKey: nullableString,
  sizeNameEn: nullableString,
  sizeNameAr: nullableString,
  styleNameEn: nullableString,
  styleNameAr: nullableString,
  fitNameEn: nullableString,
  fitNameAr: nullableString,
  imageUrl: nullableImageUrl,
  sku: nullableString,
  stock: z.coerce.number().int().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const productSpecificationSchema = z.object({
  keyEn: z.string().trim().min(1),
  keyAr: z.string().trim().min(1),
  valueEn: z.string().trim().min(1),
  valueAr: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export const productSchema = z.object({
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionAr: z.string().trim().min(1),
  metaTitleEn: nullableString,
  metaTitleAr: nullableString,
  metaDescriptionEn: nullableString,
  metaDescriptionAr: nullableString,
  ogImage: nullableImageUrl,
  shortVideoUrl: nullableString,
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.string().min(1),
  subcategoryId: nullableString,
  price: money,
  comparePrice: money.optional().nullable(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  fashionFields: fashionFieldsSchema.default({}),
  customFieldValues: z.record(jsonPrimitive).default({}),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  specifications: z.array(productSpecificationSchema).default([])
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  internalNotes: nullableString
});

export const userRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"])
});

export const userStatusSchema = z.object({
  isBanned: z.boolean()
});

export const couponSchema = z.object({
  code: z.string().trim().min(2).transform((value) => value.toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: money,
  minOrderAmount: money.default(0),
  maxUses: z.coerce.number().int().min(1),
  expiryDate: z.coerce.date(),
  isActive: z.boolean().default(true)
});

export const bannerSchema = z.object({
  titleEn: z.string().trim().min(1),
  titleAr: z.string().trim().min(1),
  subtitleEn: nullableString,
  subtitleAr: nullableString,
  buttonTextEn: nullableString,
  buttonTextAr: nullableString,
  buttonLink: z.string().trim().min(1),
  desktopImage: imageUrl,
  mobileImage: nullableImageUrl,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const bannerReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

const homepageSectionConfigSchema = z.object({
  source: z.enum(["FEATURED", "NEW", "CATEGORY", "TAG"]).optional(),
  categorySlug: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(12).default(4),
  actionLabelEn: z.string().trim().optional(),
  actionLabelAr: z.string().trim().optional(),
  actionLink: z.string().trim().optional(),
  categoryLimit: z.coerce.number().int().min(1).max(12).default(6)
});

export const homepageSectionSchema = z.object({
  type: z.enum(["CATEGORY_GRID", "PRODUCT_GRID", "CATEGORY_PRODUCT_ROWS"]),
  titleEn: nullableString,
  titleAr: nullableString,
  subtitleEn: nullableString,
  subtitleAr: nullableString,
  config: homepageSectionConfigSchema.default({}),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const settingsSchema = z.object({
  storeNameEn: z.string().trim().min(1),
  storeNameAr: z.string().trim().min(1),
  logo: nullableImageUrl,
  storeEmail: z.string().email(),
  phone: z.string().trim().min(1),
  whatsapp: nullableString,
  trn: nullableString,
  vatRate: money,
  address: z.string().trim().default(""),
  instagram: nullableString,
  facebook: nullableString,
  twitter: nullableString,
  tiktok: nullableString,
  announcementEn: nullableString,
  announcementAr: nullableString,
  announcementActive: z.boolean().default(true),
  aedToBdt: money,
  aedToUsd: money,
  freeShippingThreshold: money,
  shippingRates: z.union([z.array(shippingRateSchema), z.record(z.unknown())]),
  courierSettings: courierSettingsSchema,
  paymentSettings: paymentSettingsSchema,
  themeSettings: themeSettingsSchema,
  metaTitleEn: nullableString,
  metaTitleAr: nullableString,
  metaDescriptionEn: nullableString,
  metaDescriptionAr: nullableString,
  ogImage: nullableImageUrl,
  googleAnalyticsId: nullableString,
  facebookPixelId: nullableString
});
