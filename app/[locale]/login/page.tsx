import Link from "next/link";
import type { Metadata } from "next";
import { LockKeyhole, Mail } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";

type LoginPageProps = {
  params: { locale: string };
  searchParams?: {
    callbackUrl?: string;
  };
};

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "تسجيل الدخول" : "Login",
    description: "Admin and customer login page."
  };
}

export default function LoginPage({ params, searchParams }: LoginPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const callbackUrl = searchParams?.callbackUrl ?? `/${locale}/account`;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-navy">
          <LockKeyhole size={22} />
        </div>
        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.brand}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {locale === "ar"
              ? "استخدم حساب مسؤول للمتابعة إلى لوحة الإدارة."
              : "Use an admin account to continue to the dashboard."}
          </p>
        </div>

        <form className="mt-6 grid gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Email
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
              <input
                type="email"
                className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
                placeholder="admin@bestbazar.ae"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            Password
            <input
              type="password"
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
              placeholder="********"
            />
          </label>
          <Button type="submit" className="w-full">
            {locale === "ar" ? "متابعة" : "Continue"}
          </Button>
        </form>

        <Link
          href={`/${locale}`}
          className="mt-5 inline-flex w-full justify-center text-sm font-bold text-gold-700 hover:text-gold-800"
        >
          {dictionary.actions.continueShopping}
        </Link>
      </div>
    </main>
  );
}
