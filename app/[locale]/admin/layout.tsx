import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { authOptions } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  const pendingOrders = await prisma.order.count({
    where: { orderStatus: "PENDING" }
  });

  return (
    <AdminShell
      locale={locale}
      dictionary={getDictionary(locale)}
      adminName={session.user.name ?? "Admin"}
      pendingOrders={pendingOrders}
    >
      {children}
    </AdminShell>
  );
}
