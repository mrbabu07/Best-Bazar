import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BackButton } from "@/components/ui/BackButton";
import { getDictionary, isLocale } from "@/lib/i18n";

type ResetPasswordPageProps = {
  params: { locale: string };
  searchParams?: {
    email?: string;
    token?: string;
  };
};

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "تعيين كلمة مرور جديدة" : "Reset password",
    description: "Set a new AyVella account password."
  };
}

export default function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-soft">
        <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}/login`} className="mb-5" />
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-navy">
          <KeyRound size={22} />
        </div>
        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.brand}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            {locale === "ar" ? "تعيين كلمة مرور جديدة" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {locale === "ar"
              ? "استخدم الرابط الآمن لتعيين كلمة مرور جديدة لحسابك."
              : "Use your secure reset link to set a new account password."}
          </p>
        </div>

        <ResetPasswordForm
          locale={locale}
          initialEmail={searchParams?.email ?? ""}
          initialToken={searchParams?.token ?? ""}
        />

        <Link
          href={`/${locale}/login`}
          className="mt-5 inline-flex w-full justify-center text-sm font-bold text-gold-700 hover:text-gold-800"
        >
          {locale === "ar" ? "العودة إلى تسجيل الدخول" : "Back to sign in"}
        </Link>
      </div>
    </main>
  );
}
