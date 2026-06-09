"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

type LoginFormProps = {
  locale: Locale;
  callbackUrl: string;
};

export function LoginForm({ locale, callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const message = registerResult.error ?? "Account creation failed.";
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
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      const message = locale === "ar" ? "بيانات الدخول غير صحيحة." : "Invalid email or password.";
      setError(message);
      toast.error(locale === "ar" ? "فشل تسجيل الدخول" : "Login failed");
      return;
    }

    toast.success(mode === "register" ? "Account created" : locale === "ar" ? "تم تسجيل الدخول" : "Signed in");
    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-md bg-paper p-1">
        {[
          ["signin", locale === "ar" ? "تسجيل الدخول" : "Sign in"],
          ["register", locale === "ar" ? "حساب جديد" : "Create account"]
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
          {locale === "ar" ? "الاسم" : "Name"}
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
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
            required
          />
        </div>
      </label>
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-semibold text-navy">
          {locale === "ar" ? "الهاتف" : "Phone"}
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            autoComplete="tel"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm font-semibold text-sale">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? locale === "ar"
            ? "جار..."
            : "Working..."
          : mode === "register"
            ? locale === "ar"
              ? "إنشاء الحساب"
              : "Create account"
            : locale === "ar"
              ? "متابعة"
              : "Continue"}
      </Button>
    </form>
  );
}
