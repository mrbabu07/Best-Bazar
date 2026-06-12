"use client";

import { FormEvent, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { Locale } from "@/lib/i18n";
import { safeResponseJson } from "@/lib/safe-json";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, type CurrencyCode } from "@/utils/currency";

type TrackOrderItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  variantNameEn?: string | null;
  variantNameAr?: string | null;
  quantity: number;
  price: number;
};

type TrackOrderResult = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  createdAt: string;
  shippingAddress: {
    street: string;
    apartment?: string | null;
    tower?: string | null;
    city: string;
    emirate: string;
    country: string;
  };
  deliverySlot?: string | null;
  items: TrackOrderItem[];
};

type OrderTrackingFormProps = {
  locale: Locale;
};

function getCurrency(currency: string): CurrencyCode {
  return currency === "BDT" || currency === "USD" ? currency : "AED";
}

export function OrderTrackingForm({ locale }: OrderTrackingFormProps) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackOrderResult | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: String(formData.get("orderNumber") ?? ""),
          contact: String(formData.get("contact") ?? "")
        })
      });
      const result = await safeResponseJson<(Partial<TrackOrderResult> & { error?: string }) | null>(response, null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Order not found.");
      }

      if (!result?.id || !result?.items) {
        throw new Error("Order details could not be loaded.");
      }

      setOrder(result as TrackOrderResult);
    } catch (error) {
      setOrder(null);
      toast.error(error instanceof Error ? error.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1fr]">
      <form onSubmit={submit} className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-gold-50 text-gold-700">
            <PackageSearch size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy">Find your order</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Use the order number and the email or phone used at checkout.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Order number
            <input
              name="orderNumber"
              placeholder="BB-LX..."
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Email or phone
            <input
              name="contact"
              placeholder="admin@gmail.com or +971..."
              required
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
          </label>
          <Button type="submit" disabled={loading}>
            <Search size={17} />
            {loading ? "Checking..." : "Track order"}
          </Button>
        </div>
      </form>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        {order ? (
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">Order status</p>
                <h2 className="mt-2 text-2xl font-bold text-navy">{order.orderNumber}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Placed {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={order.orderStatus === "DELIVERED" ? "green" : "blue"}>{order.orderStatus}</Badge>
                <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"}>{order.paymentStatus}</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-paper p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Customer</p>
                <p className="mt-2 font-bold text-navy">{order.customerName}</p>
                <p className="mt-1 text-sm text-neutral-600">{order.customerEmail}</p>
                <p className="mt-1 text-sm text-neutral-600">{order.customerPhone}</p>
              </div>
              <div className="rounded-md bg-paper p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Delivery</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-neutral-700">
                  {[
                    order.shippingAddress.street,
                    order.shippingAddress.tower,
                    order.shippingAddress.apartment,
                    order.shippingAddress.city,
                    order.shippingAddress.emirate,
                    order.shippingAddress.country
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.deliverySlot ? (
                  <p className="mt-2 text-xs font-bold text-gold-700">{order.deliverySlot}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 rounded-md border border-neutral-100 p-3 text-sm">
                  <span className="font-semibold text-neutral-700">
                    {item.quantity} x {locale === "ar" ? item.nameAr : item.nameEn}
                    {item.variantNameEn ? ` / ${locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn}` : ""}
                  </span>
                  <span className="font-bold text-navy">
                    {formatCurrency(item.price * item.quantity, getCurrency(order.currency), locale)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-2 border-t border-neutral-200 pt-5 text-sm">
              {[
                ["Subtotal", order.subtotal],
                ["Shipping", order.shippingCost],
                ["Discount", -order.discount],
                ...(order.vatAmount > 0 ? [[`VAT included (${order.vatRate}%)`, order.vatAmount]] : []),
                ["Total", order.total]
              ].map(([label, value]) => (
                <div key={label} className={label === "Total" ? "flex justify-between text-base" : "flex justify-between"}>
                  <span className={label === "Total" ? "font-bold text-navy" : "text-neutral-500"}>{label}</span>
                  <span className={label === "Total" ? "font-bold text-navy" : "font-semibold text-navy"}>
                    {formatCurrency(Number(value), getCurrency(order.currency), locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md bg-paper p-6 text-center">
            <div>
              <PackageSearch size={34} className="mx-auto text-gold-700" />
              <h2 className="mt-4 text-xl font-bold text-navy">Track any Best Mart order</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                Order progress, payment status, delivery address, and totals will appear here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
