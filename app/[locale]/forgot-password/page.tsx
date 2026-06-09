import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getDictionary, isLocale } from "@/lib/i18n";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "إعادة تعيين كلمة المرور" : "Forgot password",
    description: "Request a secure password reset link."
  };
}

export default function ForgotPasswordPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-navy">
          <KeyRound size={22} />
        </div>
        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.brand}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Forgot password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {locale === "ar"
              ? "أدخل بريدك الإلكتروني وسنرسل رابطا آمنا لإعادة تعيين كلمة المرور."
              : "Enter your email and we will send a secure link to reset your password."}
          </p>
        </div>

        <ForgotPasswordForm locale={locale} />

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
