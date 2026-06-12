import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy | Best Mart",
  description: "Best Mart privacy policy for Dubai ecommerce customers."
};

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton label="Back" fallbackHref={`/${params.locale}`} className="mb-5" />
      <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">Best Mart</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Privacy policy</h1>
        <p className="mt-3 text-sm text-neutral-500">Last updated: June 10, 2026</p>

        <div className="mt-8 grid gap-6 text-sm leading-7 text-neutral-700">
          <section>
            <h2 className="text-lg font-bold text-navy">Information we collect</h2>
            <p className="mt-2">
              We collect the details needed to process orders, including name, email, phone, delivery address,
              order items, payment method, and support messages.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">How we use it</h2>
            <p className="mt-2">
              Customer information is used for checkout, delivery, order updates, fraud prevention, customer support,
              and improving the Best Mart storefront.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">Sharing and payments</h2>
            <p className="mt-2">
              We only share order information with service providers needed for payment processing, delivery,
              notifications, analytics, or legal compliance.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-navy">Customer choices</h2>
            <p className="mt-2">
              Customers can contact Best Mart to request access, correction, or deletion of personal data where
              allowed by applicable UAE laws and business record requirements.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
