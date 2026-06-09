import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1)
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: z.object({
    name: z.string().trim().min(1),
    email: z.string().email(),
    phone: z.string().trim().min(1),
    street: z.string().trim().min(1),
    apartment: z.string().trim().min(1),
    tower: z.string().trim().min(1),
    city: z.string().trim().min(1),
    emirate: z.string().trim().min(1),
    country: z.string().trim().min(1).default("UAE")
  }),
  paymentMethod: z.enum(["STRIPE", "COD"]),
  currency: z.enum(["AED", "BDT", "USD"]).default("AED"),
  locale: z.enum(["en", "ar"]).default("en"),
  couponCode: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(2),
  subtotal: z.coerce.number().min(0)
});
