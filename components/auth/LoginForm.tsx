"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

type LoginFormProps = {
  locale: Locale;
  callbackUrl: string;
};

export function LoginForm({ locale, callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@bestbazar.ae");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      setError(locale === "ar" ? "بيانات الدخول غير صحيحة." : "Invalid email or password.");
      toast.error(locale === "ar" ? "فشل تسجيل الدخول" : "Login failed");
      return;
    }

    toast.success(locale === "ar" ? "تم تسجيل الدخول" : "Signed in");
    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-navy">
        Email
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
        Password
        <div className="relative">
          <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
            autoComplete="current-password"
            required
          />
        </div>
      </label>
      {error ? <p className="text-sm font-semibold text-sale">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (locale === "ar" ? "جار..." : "Signing in...") : locale === "ar" ? "متابعة" : "Continue"}
      </Button>
    </form>
  );
}
