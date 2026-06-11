"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { safeResponseJson } from "@/lib/safe-json";

type ForgotPasswordFormProps = {
  locale: Locale;
};

const copy = {
  en: {
    email: "Email",
    submit: "Send reset link",
    sending: "Sending...",
    sent: "If an account exists, a reset link has been sent.",
    failed: "Unable to send reset link.",
    devLink: "Open local reset link"
  },
  ar: {
    email: "البريد الإلكتروني",
    submit: "إرسال رابط إعادة التعيين",
    sending: "جار الإرسال...",
    sent: "إذا كان الحساب موجودا، تم إرسال رابط إعادة التعيين.",
    failed: "تعذر إرسال رابط إعادة التعيين.",
    devLink: "فتح رابط إعادة التعيين المحلي"
  }
};

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const labels = copy[locale];
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResetUrl("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale })
      });
      const result = await safeResponseJson<{ error?: string; resetUrl?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? labels.failed);
      }

      setSent(true);
      setResetUrl(result?.resetUrl ?? "");
      toast.success(labels.sent);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {labels.email}
        <div className="relative">
          <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
            autoComplete="email"
            required
          />
        </div>
      </label>

      {sent ? <p className="text-sm font-semibold text-emerald-700">{labels.sent}</p> : null}
      {resetUrl ? (
        <Link href={resetUrl} className="text-sm font-bold text-gold-700 hover:text-gold-800">
          {labels.devLink}
        </Link>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? labels.sending : labels.submit}
      </Button>
    </form>
  );
}
