import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms and Conditions | Best Bazar",
  description: "Best Bazar ecommerce terms for Dubai customers."
};

export default function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton label="Back" fallbackHref={`/${params.locale}`} className="mb-5" />
      <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">Best Bazar</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Terms and conditions</h1>
        <p className="mt-3 text-sm text-neutral-500">Last updated: June 10, 2026</p>

        <div className="mt-8 grid gap-6 text-sm leading-7 text-neutral-700">
          <section>
            <h2 className="text-lg font-bold text-navy">Orders</h2>
            <p className="mt-2">
              Orders are accepted after stock, address, and payment details are validated. Best Bazar may contact
              customers to confirm delivery information before dispatch.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">Pricing and payment</h2>
            <p className="mt-2">
              Prices are shown in AED by default. Card, cash on delivery, and supported pay-later options may be
              offered depending on checkout availability and provider approval.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">Dubai delivery</h2>
            <p className="mt-2">
              Delivery timing depends on selected area, slot, stock readiness, and courier capacity. Customers are
              responsible for accurate apartment, villa, tower, and phone details.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">Returns and support</h2>
            <p className="mt-2">
              Return or exchange requests are reviewed through Best Bazar support. Items should be unused, complete,
              and reported within the published return window for the product.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
