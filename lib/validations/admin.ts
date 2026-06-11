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
  occasion: nullableString.default(""),
  season: nullableString.default(""),
  care: nullableString.default(""),
  halalBadge: z.boolean().default(false)
});
const paymentSettingsSchema = z.object({
  cod: z.object({
    enabled: z.boolean().default(true),
    displayName: z.string().trim().default("Cash on delivery"),
    instructions: z.string().trim().default("")
  }),
  bankTransfer: z.object({
    enabled: z.boolean().default(false),
    displayName: z.string().trim().default("Bank transfer"),
    bankName: z.string().trim().default(""),
    accountName: z.string().trim().default(""),
    accountNumber: z.string().trim().default(""),
    iban: z.string().trim().default(""),
    swift: z.string().trim().default(""),
    branch: z.string().trim().default(""),
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
  }),
  tabby: z.object({
    enabled: z.boolean().default(false),
    displayName: z.string().trim().default("Tabby"),
    secretKey: z.string().trim().default(""),
    merchantCode: z.string().trim().default(""),
    apiBaseUrl: z.string().trim().default("https://api.tabby.ai"),
    instructions: z.string().trim().default("")
  }),
  tamara: z.object({
    enabled: z.boolean().default(false),
    displayName: z.string().trim().default("Tamara"),
    apiToken: z.string().trim().default(""),
    apiBaseUrl: z.string().trim().default("https://api-sandbox.tamara.co"),
    instructions: z.string().trim().default("")
  }),
  paypal: z.object({
    enabled: z.boolean().default(false),
    displayName: z.string().trim().default("PayPal"),
    clientId: z.string().trim().default(""),
    clientSecret: z.string().trim().default(""),
    apiBaseUrl: z.string().trim().default("https://api-m.sandbox.paypal.com"),
    instructions: z.string().trim().default("")
  })
});
const themeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  paperColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  inkColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  radius: z.enum(["compact", "soft", "rounded"]),
  buttonStyle: z.enum(["gradient", "solid"]),
  productCardStyle: z.enum(["standard", "compact", "elevated"])
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

export const settingsSchema = z.object({
  storeNameEn: z.string().trim().min(1),
  storeNameAr: z.string().trim().min(1),
  logo: nullableImageUrl,
  storeEmail: z.string().email(),
  phone: z.string().trim().min(1),
  whatsapp: nullableString,
  trn: nullableString,
  vatRate: money,
  address: z.string().trim().min(1),
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
  shippingRates: z.union([z.array(shippingRateSchema), z.record(shippingRateSchema)]),
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
