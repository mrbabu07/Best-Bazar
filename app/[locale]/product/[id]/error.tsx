"use client";

import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const isArabic = params?.locale === "ar";

  return (
    <main className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {isArabic ? "اتصال مؤقت" : "Temporary connection issue"}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-950 sm:text-3xl">
          {isArabic ? "تعذر تحميل المنتج الآن" : "We could not load this product right now"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-600 sm:text-base">
          {isArabic
            ? "قد تكون قاعدة البيانات قيد الاستيقاظ. يرجى المحاولة مرة أخرى بعد لحظات."
            : "The store database may be waking up. Please try again in a moment."}
        </p>
        <Button className="mt-6 min-w-40" onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {isArabic ? "إعادة المحاولة" : "Try again"}
        </Button>
      </div>
    </main>
  );
}
