import Link from "next/link";
import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { BackButton } from "@/components/ui/BackButton";
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
  // Default to home page after login
  const callbackUrl = searchParams?.callbackUrl ?? `/${locale}`;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-soft">
        <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}`} className="mb-5" />
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
              ? "سجّل الدخول أو أنشئ حساباً لمتابعة الطلبات والعناوين."
              : "Sign in or create an account to manage orders, addresses, and admin tools."}
          </p>
        </div>

        <LoginForm locale={locale} callbackUrl={callbackUrl} />

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
