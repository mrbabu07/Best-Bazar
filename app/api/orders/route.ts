import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { getOptionalServerSession } from "@/lib/auth-session";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createStoreOrder } from "@/lib/orders";
import { orderCreateSchema } from "@/lib/validations/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(JSON.parse(JSON.stringify(orders)));
}

export async function POST(request: Request) {
  try {
    const session = await getOptionalServerSession(request);
    const data = orderCreateSchema.parse(await request.json());
    const order = await createStoreOrder(data, session?.user.id);

    if (data.paymentMethod !== "STRIPE") {
      await sendOrderConfirmationEmail(order);
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid order payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create order." }, { status: 500 });
  }
}
