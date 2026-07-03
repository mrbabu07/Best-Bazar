import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParcelContactActions } from "@/components/order/ParcelContactActions";
import { getOrderItemDetails } from "@/lib/order-item-label";
import { prisma } from "@/lib/prisma";

type ParcelPageProps = {
  params: { locale: string; id: string };
  searchParams?: { token?: string };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parcel details | AyVella",
  robots: { index: false, follow: false }
};

function whatsappNumber(phone: string, country: string) {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && /united arab emirates|uae/i.test(country)) digits = `971${digits.slice(1)}`;
  if (digits.startsWith("0") && /bangladesh/i.test(country)) digits = `880${digits.slice(1)}`;
  return digits;
}

export default async function ParcelPage({ params, searchParams }: ParcelPageProps) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: { select: { sku: true } },
          variant: {
            select: {
              colorNameEn: true,
              colorNameAr: true,
              sizeNameEn: true,
              sizeNameAr: true
            }
          }
        }
      }
    }
  });

  if (!order?.accessToken || searchParams?.token !== order.accessToken) notFound();

  const address = [order.street, order.tower, order.apartment, order.city, order.emirate, order.country]
    .filter(Boolean)
    .join(", ");
  const phoneNumber = whatsappNumber(order.customerPhone, order.country);
  const whatsappText = encodeURIComponent(`AyVella order ${order.orderNumber}`);
  const whatsappHref = `https://wa.me/${phoneNumber}?text=${whatsappText}`;
  return (
    <main className="min-h-screen bg-[#f4f4f0] px-4 py-8 text-neutral-950 sm:px-6">
      <article className="mx-auto max-w-3xl border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#111] sm:p-8">
        <header className="flex items-end justify-between border-b-4 border-neutral-950 pb-4">
          <div>
            <p className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">AYVELLA</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.24em]">Parcel details</p>
          </div>
          <p className="text-right text-xs font-bold">{order.orderNumber}</p>
        </header>

        <section className="border-b-2 border-dashed border-neutral-950 py-5">
          <p className="text-xs font-black uppercase tracking-[0.16em]">Deliver to</p>
          <h1 className="mt-2 text-3xl font-black">{order.customerName}</h1>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-2 block text-lg font-black underline underline-offset-4">
            {order.customerPhone}
          </a>
          {order.customerEmail ? <p className="mt-1 text-sm font-semibold">{order.customerEmail}</p> : null}
          <p className="mt-3 text-base font-semibold leading-6">{address}</p>
        </section>

        <section className="border-b-2 border-dashed border-neutral-950 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-wider">Product</p><p className="mt-1 font-black">{order.currency} {Number(order.subtotal).toFixed(2)}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider">Delivery</p><p className="mt-1 font-black">{order.currency} {Number(order.shippingCost).toFixed(2)}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider">Total</p><p className="mt-1 text-lg font-black">{order.currency} {Number(order.total).toFixed(2)}</p></div>
          </div>
        </section>

        <section className="py-5">
          <h2 className="text-xs font-black uppercase tracking-[0.16em]">Products</h2>
          <div className="mt-3 divide-y-2 divide-neutral-950 border-y-2 border-neutral-950">
            {order.items.map((item) => {
              const details = getOrderItemDetails(item, params.locale);
              return (
                <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-lg font-black">{details.name}</p>
                    {details.code ? <p className="mt-2 text-2xl font-black tracking-[0.04em]">CODE: {details.code}</p> : null}
                    <p className="mt-1 text-sm font-semibold">{[details.color ? `Color: ${details.color}` : "", details.size ? `Size: ${details.size}` : ""].filter(Boolean).join(" | ")}</p>
                  </div>
                  <p className="font-black">Qty: {details.quantity}</p>
                </div>
              );
            })}
          </div>
        </section>

        <ParcelContactActions phone={order.customerPhone} address={address} whatsappHref={whatsappHref} />
      </article>
    </main>
  );
}
