import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { orders } from "@/lib/data";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { formatCurrency } from "@/utils/currency";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "حسابي" : "My account",
    description: "Customer profile, address book, and order history."
  };
}

export default function AccountPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

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
              AR
            </div>
            <div>
              <h2 className="font-bold text-navy">Aisha Rahman</h2>
              <p className="text-sm text-neutral-500">aisha@example.com</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {[dictionary.account.profile, dictionary.account.addresses, dictionary.account.orders].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-md bg-paper px-3 py-3 text-left text-sm font-semibold text-navy hover:bg-gold-50 rtl:text-right"
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <section className="grid gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.account.profile}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {["Name", "Email", "Phone", "City"].map((label) => (
                <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    defaultValue={
                      label === "Name"
                        ? "Aisha Rahman"
                        : label === "Email"
                          ? "aisha@example.com"
                          : label === "Phone"
                            ? "+971 55 123 1122"
                            : "Dubai"
                    }
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.account.addresses}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {["Business Bay, Dubai", "Jumeirah 3, Dubai"].map((address) => (
                <div key={address} className="rounded-lg border border-neutral-200 bg-paper p-4">
                  <p className="font-bold text-navy">{address}</p>
                  <p className="mt-2 text-sm text-neutral-600">United Arab Emirates</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-xl font-bold text-navy">{dictionary.account.orders}</h2>
            </div>
            <div className="overflow-x-auto">
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
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-bold text-navy">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-neutral-600">
                        {order.items.map((item) => getLocalized(item.name, locale)).join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={order.orderStatus === "delivered" ? "green" : "gold"}>
                          {order.orderStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 font-bold text-navy">
                        {formatCurrency(order.total, order.currency, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
