import type { Metadata } from "next";
import { OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { CancelOrderButton } from "@/components/account/CancelOrderButton";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { authOptions } from "@/lib/auth";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatOrderStatus } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeCurrencyRates, type CurrencyCode } from "@/utils/currency";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "حسابي" : "My account",
    description: "Customer profile, address book, and order history."
  };
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || "Best Mart";
  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getCurrency(currency: string): CurrencyCode {
  return currency === "BDT" || currency === "USD" ? currency : "AED";
}

function formatOrderAddress(order: {
  street: string;
  apartment?: string | null;
  tower?: string | null;
  city: string;
}) {
  return [order.street, order.tower, order.apartment, order.city].filter(Boolean).join(", ");
}

function getOrderTone(status: string) {
  if (status === "DELIVERED") {
    return "green" as const;
  }

  if (status === "CANCELLED") {
    return "red" as const;
  }

  if (status === "PROCESSING" || status === "SHIPPED") {
    return "blue" as const;
  }

  return "gold" as const;
}

function canCancelOrder(status: string) {
  return status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED;
}

const accountCopy = {
  en: {
    defaultName: "Best Mart customer",
    noAddresses: "No saved addresses yet.",
    noOrders: "No orders yet.",
    order: "Order",
    items: "Items",
    status: "Status",
    total: "Total"
  },
  ar: {
    defaultName: "عميل بيست مارت",
    noAddresses: "لا توجد عناوين محفوظة حتى الآن.",
    noOrders: "لا توجد طلبات حتى الآن.",
    order: "الطلب",
    items: "المنتجات",
    status: "الحالة",
    total: "الإجمالي"
  }
} satisfies Record<
  Locale,
  {
    defaultName: string;
    noAddresses: string;
    noOrders: string;
    order: string;
    items: string;
    status: string;
    total: string;
  }
>;

export default async function AccountPage({ params }: { params: { locale: string } }) {
  noStore();
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/account`);
  }

  const dictionary = getDictionary(locale);
  const labels = accountCopy[locale];
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { aedToBdt: true, aedToUsd: true }
    })
  ]);

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/account`);
  }

  const currencyRates = normalizeCurrencyRates({
    AED: 1,
    BDT: settings?.aedToBdt,
    USD: settings?.aedToUsd
  });

  const profile = {
    name: user.name ?? "",
    email: user.email,
    phone: user.phone ?? "",
    street: user.street ?? "",
    city: user.city ?? "",
    country: user.country ?? ""
  };
  const savedAddresses = [
    user.street && user.city
      ? {
          title: `${user.street}, ${user.city}`,
          country: user.country ?? "United Arab Emirates"
        }
      : null,
    ...user.orders.map((order) => ({
      title: formatOrderAddress(order),
      country: order.country
    }))
  ].filter((address, index, addresses): address is { title: string; country: string } => {
    if (!address) {
      return false;
    }

    return addresses.findIndex((item) => item?.title === address.title) === index;
  });
  const sections = [
    { id: "profile", label: dictionary.account.profile },
    { id: "addresses", label: dictionary.account.addresses },
    { id: "orders", label: dictionary.account.orders }
  ];
  const cancelOrderCopy = {
    cancelOrder: dictionary.account.cancelOrder,
    cancellingOrder: dictionary.account.cancellingOrder,
    cancelOrderConfirm: dictionary.account.cancelOrderConfirm,
    cancelOrderSuccess: dictionary.account.cancelOrderSuccess,
    cancelOrderError: dictionary.account.cancelOrderError
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}`} className="mb-4" />
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
          {dictionary.nav.account}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">{dictionary.account.title}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{dictionary.account.subtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gold-100 text-xl font-bold text-navy">
              {getInitials(user.name, user.email)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-navy">{user.name ?? labels.defaultName}</h2>
              <p className="truncate text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {sections.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md bg-paper px-3 py-3 text-left text-sm font-semibold text-navy hover:bg-gold-50 rtl:text-right"
              >
                {item.label}
              </a>
            ))}
          </div>
        </aside>

        <section className="grid gap-6">
          <div id="profile" className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.account.profile}</h2>
            <AccountProfileForm locale={locale} profile={profile} saveLabel={dictionary.actions.save} />
          </div>

          <div id="addresses" className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.account.addresses}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {savedAddresses.length > 0 ? (
                savedAddresses.slice(0, 4).map((address) => (
                  <div key={address.title} className="rounded-lg border border-neutral-200 bg-paper p-4">
                    <p className="font-bold text-navy">{address.title}</p>
                    <p className="mt-2 text-sm text-neutral-600">{address.country}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500 sm:col-span-2">
                  {labels.noAddresses}
                </p>
              )}
            </div>
          </div>

          <div id="orders" className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-xl font-bold text-navy">{dictionary.account.orders}</h2>
            </div>
            <div className="overflow-x-auto">
              {user.orders.length > 0 ? (
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
                    <tr>
                      <th className="px-5 py-3">{labels.order}</th>
                      <th className="px-5 py-3">{labels.items}</th>
                      <th className="px-5 py-3">{labels.status}</th>
                      <th className="px-5 py-3">{labels.total}</th>
                      <th className="px-5 py-3">{dictionary.account.orderAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {user.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-5 py-4 font-bold text-navy">
                          <Link href={`/${locale}/order-confirmation/${order.id}`} className="hover:text-gold-700">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">
                          {order.items
                            .map((item) => {
                              const productName = locale === "ar" ? item.nameAr : item.nameEn;
                              const variantName = locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn;

                              return variantName ? `${productName} / ${variantName}` : productName;
                            })
                            .join(", ")}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getOrderTone(order.orderStatus)}>
                            {formatOrderStatus(order.orderStatus, locale)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-bold text-navy">
                          {formatCurrency(Number(order.total), getCurrency(order.currency), locale, currencyRates)}
                        </td>
                        <td className="px-5 py-4">
                          {canCancelOrder(order.orderStatus) ? (
                            <CancelOrderButton orderId={order.id} copy={cancelOrderCopy} />
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-sm text-neutral-500">
                  {labels.noOrders}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
