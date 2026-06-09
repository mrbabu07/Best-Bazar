import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminStats } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";

export default function AdminLayout({
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

  return (
    <AdminShell
      locale={locale}
      dictionary={getDictionary(locale)}
      adminName="Omar Khan"
      pendingOrders={adminStats.pendingOrders}
    >
      {children}
    </AdminShell>
  );
}
