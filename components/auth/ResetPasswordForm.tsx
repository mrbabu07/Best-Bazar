"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import { safeResponseJson } from "@/lib/safe-json";

type ResetPasswordFormProps = {
  locale: Locale;
  initialEmail: string;
  initialToken: string;
};

const copy = {
  en: {
    email: "Email",
    token: "Token",
    password: "New password",
    confirm: "Confirm password",
    submit: "Reset password",
    saving: "Saving...",
    saved: "Password updated. Sign in with your new password.",
    mismatch: "Passwords do not match.",
    failed: "Unable to reset password."
  },
  ar: {
    email: "البريد الإلكتروني",
    token: "رمز التحقق",
    password: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور",
    submit: "إعادة تعيين كلمة المرور",
    saving: "جار الحفظ...",
    saved: "تم تحديث كلمة المرور. سجل الدخول بكلمة المرور الجديدة.",
    mismatch: "كلمتا المرور غير متطابقتين.",
    failed: "تعذر إعادة تعيين كلمة المرور."
  }
};

export function ResetPasswordForm({ locale, initialEmail, initialToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const labels = copy[locale];
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error(labels.mismatch);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password })
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? labels.failed);
      }

      toast.success(labels.saved);
      router.push(`/${locale}/login`);
      router.refresh();
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
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {labels.token}
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="h-11 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {labels.password}
        <div className="relative">
          <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-navy">
        {labels.confirm}
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-11 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? labels.saving : labels.submit}
      </Button>
    </form>
  );
}
