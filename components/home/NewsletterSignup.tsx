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
    <section className="border-y border-[#dfd9cb] bg-[#f4f6ee] px-4 py-14 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto grid max-w-[760px] gap-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          {locale === "ar" ? "Best Mart updates" : "Best Mart updates"}
        </p>
        <h2 className="font-editorial text-4xl font-semibold text-neutral-950 sm:text-5xl">
          {locale === "ar" ? "Subscribe to our emails" : "Subscribe to our emails"}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
          {locale === "ar"
            ? "Subscribe for new products, offers, and Dubai delivery updates."
            : "Join our email list for exclusive offers, new collections, and Dubai delivery updates."}
        </p>
        <form onSubmit={submit} className="mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={locale === "ar" ? "Email address" : "Email address"}
            className="h-14 rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-14 rounded-md bg-[#d1bd76] px-8 text-sm font-semibold text-white transition hover:bg-[#bba55d] disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            {submitting ? "Sending..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
