import type { CurrencyCode } from "@/utils/currency";

export type Locale = "en" | "ar";

export type LocalizedText = {
  en: string;
  ar: string;
};

export type ProductImage = {
  url: string;
  alt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: LocalizedText;
  image: string;
  productCount: number;
  parentCategory?: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProductSpecification = {
  key: LocalizedText;
  value: LocalizedText;
};

export type ProductVariant = {
  id: string;
  name: LocalizedText;
  colorName: LocalizedText;
  colorHex?: string;
  sizeKey?: string;
  sizeName?: LocalizedText;
  imageUrl?: string;
  sku?: string;
  stock: number;
  isActive: boolean;
  sortOrder: number;
};

export type ProductColor = {
  key: string;
  name: LocalizedText;
  colorHex?: string;
  count: number;
};

export type ProductSize = {
  key: string;
  name: LocalizedText;
  count: number;
};

export type Product = {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  seo?: {
    title?: LocalizedText;
    description?: LocalizedText;
    ogImage?: string;
  };
  category: string;
  subcategory?: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  stock: number;
  sku: string;
  brand: string;
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export type Order = {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    name: LocalizedText;
    variantName?: LocalizedText;
    variantColorHex?: string;
    variantSku?: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    street: string;
    apartment?: string;
    tower?: string;
    city: string;
    emirate: string;
    country: string;
  };
  deliverySlot?: string;
  paymentMethod: "stripe" | "cod" | "tabby" | "tamara" | "paypal" | "bank_transfer";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discount: number;
  vatRate?: number;
  vatAmount?: number;
  total: number;
  currency: CurrencyCode;
  notes?: string;
  createdAt: string;
};

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  city: string;
  isBanned: boolean;
  orders: number;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
};
