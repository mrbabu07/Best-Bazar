"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

type LoginFormProps = {
  locale: Locale;
  callbackUrl: string;
};

const copy = {
  en: {
    signIn: "Sign in",
    createAccount: "Create account",
    name: "Name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    forgotPassword: "Forgot password?",
    working: "Working...",
    continue: "Continue",
    invalidCredentials: "Invalid email or password.",
    loginFailed: "Login failed",
    signedIn: "Signed in",
    accountCreated: "Account created",
    accountCreationFailed: "Account creation failed."
  },
  ar: {
    signIn: "تسجيل الدخول",
    createAccount: "حساب جديد",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    phone: "الهاتف",
    forgotPassword: "نسيت كلمة المرور؟",
    working: "جار...",
    continue: "متابعة",
    invalidCredentials: "بيانات الدخول غير صحيحة.",
    loginFailed: "فشل تسجيل الدخول",
    signedIn: "تم تسجيل الدخول",
    accountCreated: "تم إنشاء الحساب",
    accountCreationFailed: "تعذر إنشاء الحساب."
  }
} satisfies Record<
  Locale,
  {
    signIn: string;
    createAccount: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    forgotPassword: string;
    working: string;
    continue: string;
    invalidCredentials: string;
    loginFailed: string;
    signedIn: string;
    accountCreated: string;
    accountCreationFailed: string;
  }
>;

export function LoginForm({ locale, callbackUrl }: LoginFormProps) {
  const labels = copy[locale];
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fallbackUrl = `/${locale}`;
  const redirectTarget =
    callbackUrl?.startsWith(`/${locale}`) && !callbackUrl.startsWith("//") ? callbackUrl : fallbackUrl;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "register") {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: phone || undefined })
      });
      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        const message = registerResult.error ?? labels.accountCreationFailed;
        setLoading(false);
        setError(message);
        toast.error(message);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: redirectTarget
    });

    if (!result?.ok || result.error) {
      const message = labels.invalidCredentials;
      setLoading(false);
      setError(message);
      toast.error(labels.loginFailed);
      return;
    }

    toast.success(mode === "register" ? labels.accountCreated : labels.signedIn);

    await getSession();

    router.replace(result.url && result.url.startsWith("/") ? result.url : redirectTarget);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-md bg-paper p-1">
        {[
          ["signin", labels.signIn],
          ["register", labels.createAccount]
        ].map(([itemMode, label]) => (
          <button
            key={itemMode}
            type="button"
            onClick={() => {
              setMode(itemMode as "signin" | "register");
              setError("");
            }}
            className={`h-9 rounded-md text-sm font-bold ${
              mode === itemMode ? "bg-white text-navy shadow-soft" : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-semibold text-navy">
          {labels.name}
          <div className="relative">
            <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
              autoComplete="name"
              required
            />
          </div>
        </label>
      ) : null}

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
        {labels.password}
        <div className="relative">
          <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
            required
          />
        </div>
      </label>
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-semibold text-navy">
          {labels.phone}
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            autoComplete="tel"
          />
        </label>
      ) : null}
      {mode === "signin" ? (
        <Link
          href={`/${locale}/forgot-password`}
          className="text-right text-sm font-bold text-gold-700 hover:text-gold-800 rtl:text-left"
        >
          {labels.forgotPassword}
        </Link>
      ) : null}
      {error ? <p className="text-sm font-semibold text-sale">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? labels.working
          : mode === "register"
            ? labels.createAccount
            : labels.continue}
      </Button>
    </form>
  );
}
