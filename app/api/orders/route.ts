import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { getOptionalServerSession } from "@/lib/auth-session";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { sendOrderMessagingNotifications } from "@/lib/notifications";
import { assertPaymentMethodAvailable } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import { createStoreOrder } from "@/lib/orders";
import { toJsonSafeValue } from "@/lib/safe-json";
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

  return NextResponse.json(toJsonSafeValue(orders));
}

export async function POST(request: Request) {
  try {
    const session = await getOptionalServerSession(request);
    const data = orderCreateSchema.parse(await request.json());

    if (data.paymentMethod !== "COD") {
      return NextResponse.json({ error: "Use the payment checkout endpoint for online payment methods." }, { status: 400 });
    }

    await assertPaymentMethodAvailable(data.paymentMethod);

    const order = await createStoreOrder(data, session?.user.id);

    await Promise.allSettled([
      sendOrderConfirmationEmail(order),
      sendOrderMessagingNotifications(order, "created")
    ]);

    return NextResponse.json(toJsonSafeValue(order), { status: 201 });
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
