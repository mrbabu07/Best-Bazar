"use client";

import { type FormEvent, useState } from "react";
import toast from "react-hot-toast";
import type { Locale } from "@/lib/i18n";

type NewsletterSignupProps = {
  locale: Locale;
};

export function NewsletterSignup({ locale }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Subscribe failed");
      }

      toast.success(locale === "ar" ? "Subscribed successfully" : "Subscribed successfully");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscribe failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-y border-neutral-200 bg-[#f4f7ef] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto grid max-w-[1120px] gap-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          {locale === "ar" ? "Best Mart updates" : "Best Mart updates"}
        </p>
        <h2 className="text-3xl font-semibold text-neutral-950 sm:text-5xl">
          {locale === "ar" ? "Get new arrivals and offers" : "Get new arrivals and offers"}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
          {locale === "ar"
            ? "Subscribe for new products, offers, and Dubai delivery updates."
            : "Subscribe for new products, offers, and Dubai delivery updates."}
        </p>
        <form onSubmit={submit} className="mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={locale === "ar" ? "Email address" : "Email address"}
            className="h-14 rounded-none border border-neutral-300 bg-white px-4 text-base text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-14 bg-neutral-950 px-8 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {submitting ? "Sending..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
