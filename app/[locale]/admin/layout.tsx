import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { OrderStatus, Prisma } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { authOptions } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NumericLike = Prisma.Decimal | number | bigint | string | null | undefined;

type AdminNotificationRow = {
  pendingOrders: NumericLike;
  pendingReviews: NumericLike;
  lowStockProducts: NumericLike;
};

function toNumber(value: NumericLike) {
  return Number(value ?? 0);
}

async function readAdminNotifications() {
  const [row] = await prisma.$queryRaw<AdminNotificationRow[]>(
    Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM "Order"
          WHERE "orderStatus" = ${OrderStatus.PENDING}::"OrderStatus") AS "pendingOrders",
        (SELECT COUNT(*) FROM "Review" WHERE "isApproved" = false) AS "pendingReviews",
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" = true AND stock <= 10) AS "lowStockProducts"
    `
  );

  return {
    pendingOrders: toNumber(row?.pendingOrders),
    pendingReviews: toNumber(row?.pendingReviews),
    lowStockProducts: toNumber(row?.lowStockProducts)
  };
}

async function readAdminNotificationsWithRetry() {
  try {
    return await readAdminNotifications();
  } catch (error) {
    console.error("Admin notifications failed. Retrying once.", error);

    try {
      await prisma.$disconnect();
      return await readAdminNotifications();
    } catch (retryError) {
      console.error("Admin notifications failed after retry.", retryError);
      return {
        pendingOrders: 0,
        pendingReviews: 0,
        lowStockProducts: 0
      };
    }
  }
}

export default async function AdminLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  if (session?.user.role !== "admin") {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/dashboard`);
  }

  const notifications = await readAdminNotificationsWithRetry();

  return (
    <AdminShell
      locale={locale}
      dictionary={getDictionary(locale)}
      adminName={session.user.name ?? "Admin"}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
