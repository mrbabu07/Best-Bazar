export const dynamic = "force-dynamic";

import { OrderStatus, Prisma } from "@prisma/client";
import { handleApiError, requireAdmin } from "@/lib/api/admin";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  const escaped = text.replace(/"/g, "\"\"");

  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function readDate(value: string | null, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
}

function buildOrderWhere(url: URL) {
  const search = url.searchParams.get("search")?.trim();
  const status = url.searchParams.get("status");
  const from = readDate(url.searchParams.get("from"));
  const to = readDate(url.searchParams.get("to"), true);
  const createdAt: Prisma.DateTimeFilter = {};

  if (from) {
    createdAt.gte = from;
  }

  if (to) {
    createdAt.lte = to;
  }

  return {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? { orderStatus: status as OrderStatus }
      : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {})
  } satisfies Prisma.OrderWhereInput;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const orders = await prisma.order.findMany({
      where: buildOrderWhere(url),
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5000
    });
    const header = [
      "Order number",
      "Date",
      "Customer",
      "Email",
      "Phone",
      "Order status",
      "Payment method",
      "Payment status",
      "Subtotal",
      "Shipping",
      "Discount",
      "VAT included",
      "Total",
      "Currency",
      "Emirate",
      "Delivery slot",
      "Items"
    ];
    const rows = orders.map((order) => [
      order.orderNumber,
      order.createdAt.toISOString(),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.orderStatus,
      order.paymentMethod,
      order.paymentStatus,
      Number(order.subtotal).toFixed(2),
      Number(order.shippingCost).toFixed(2),
      Number(order.discount).toFixed(2),
      Number(order.vatAmount).toFixed(2),
      Number(order.total).toFixed(2),
      order.currency,
      order.emirate,
      order.deliverySlot ?? "",
      order.items
        .map((item) => `${item.quantity} x ${item.nameEn}${item.variantNameEn ? ` / ${item.variantNameEn}` : ""}`)
        .join("; ")
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const filename = `best-bazar-sales-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
