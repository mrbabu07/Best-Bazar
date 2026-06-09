import type { Metadata } from "next";
import { CalendarDays, Printer, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { orders } from "@/lib/data";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { formatCurrency } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Order Management | Best Bazar"
};

export default function AdminOrdersPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const selectedOrder = orders[0];

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.orders}
        title={dictionary.admin.orders}
        subtitle="Search, filter, review order details, update status, and print invoices."
      />

      <div className="mb-5 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            placeholder="Search order or customer"
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
          />
        </label>
        <select className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm">
          <option>All statuses</option>
          <option>pending</option>
          <option>processing</option>
          <option>delivered</option>
        </select>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-semibold text-navy"
        >
          <CalendarDays size={17} />
          Date range
        </button>
        <Button variant="secondary">{dictionary.actions.apply}</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4 font-bold text-navy">{order.orderNumber}</td>
                    <td className="px-5 py-4 text-neutral-600">{order.customer.name}</td>
                    <td className="px-5 py-4">
                      <Badge tone={order.paymentStatus === "paid" ? "green" : "gold"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <select defaultValue={order.orderStatus} className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm">
                        {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 font-bold text-navy">
                      {formatCurrency(order.total, "AED", locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy">{selectedOrder.orderNumber}</h2>
              <p className="mt-1 text-sm text-neutral-500">{selectedOrder.customer.email}</p>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
              aria-label={dictionary.actions.print}
            >
              <Printer size={18} />
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {selectedOrder.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-4 text-sm">
                <span className="text-neutral-600">
                  {item.quantity} x {getLocalized(item.name, locale)}
                </span>
                <span className="font-bold text-navy">{formatCurrency(item.price * item.quantity, "AED", locale)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 border-t border-neutral-200 pt-5 text-sm">
            <p className="font-bold text-navy">{selectedOrder.customer.name}</p>
            <p className="text-neutral-600">{selectedOrder.customer.phone}</p>
            <p className="text-neutral-600">
              {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.emirate}
            </p>
          </div>
          <Button className="mt-5 w-full">{dictionary.actions.save}</Button>
        </aside>
      </div>
    </div>
  );
}
