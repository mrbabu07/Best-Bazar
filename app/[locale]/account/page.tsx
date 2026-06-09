import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { authOptions } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n";
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
  const source = name || email || "Best Bazar";
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

  const profileFields = [
    { label: "Name", value: user.name ?? "" },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone ?? "" },
    { label: "City", value: user.city ?? "" }
  ];
  const savedAddresses = [
    user.street && user.city
      ? {
          title: `${user.street}, ${user.city}`,
          country: user.country ?? "United Arab Emirates"
        }
      : null,
    ...user.orders.map((order) => ({
      title: `${order.street}, ${order.city}`,
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
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
              <h2 className="truncate font-bold text-navy">{user.name ?? "Best Bazar customer"}</h2>
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {profileFields.map((field) => (
                <label key={field.label} className="grid gap-2 text-sm font-semibold text-navy">
                  {field.label}
                  <input
                    value={field.value}
                    readOnly
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm text-neutral-700"
                  />
                </label>
              ))}
            </div>
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
                  {locale === "ar" ? "لا توجد عناوين محفوظة حتى الآن." : "No saved addresses yet."}
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
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Total</th>
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
                          {order.items.map((item) => (locale === "ar" ? item.nameAr : item.nameEn)).join(", ")}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={getOrderTone(order.orderStatus)}>{order.orderStatus}</Badge>
                        </td>
                        <td className="px-5 py-4 font-bold text-navy">
                          {formatCurrency(Number(order.total), getCurrency(order.currency), locale, currencyRates)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-sm text-neutral-500">
                  {locale === "ar" ? "لا توجد طلبات حتى الآن." : "No orders yet."}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
