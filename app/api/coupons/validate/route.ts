import { DiscountType } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { couponValidateSchema } from "@/lib/validations/store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { code, subtotal } = couponValidateSchema.parse(await request.json());
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.isActive || coupon.expiryDate < new Date()) {
      return NextResponse.json({ valid: false, discount: 0, message: "Coupon is not valid." }, { status: 404 });
    }

    if (coupon.usedCount >= coupon.maxUses || Number(coupon.minOrderAmount) > subtotal) {
      return NextResponse.json({ valid: false, discount: 0, message: "Coupon requirements are not met." }, { status: 422 });
    }

    const discount =
      coupon.discountType === DiscountType.PERCENT
        ? Math.min((subtotal * Number(coupon.discountValue)) / 100, subtotal)
        : Math.min(Number(coupon.discountValue), subtotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ valid: false, discount: 0, message: error.errors[0]?.message ?? "Invalid coupon payload." }, { status: 400 });
    }

    return NextResponse.json({ valid: false, discount: 0, message: "Unable to validate coupon." }, { status: 500 });
  }
}
