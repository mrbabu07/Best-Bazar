"use client";

import { Send, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import type { ProductReview } from "@/lib/types";
import { cn } from "@/utils/cn";

type ProductReviewsProps = {
  productId: string;
  productSlug: string;
  locale: Locale;
  initialRating: number;
  initialReviewCount: number;
  initialReviews: ProductReview[];
};

const copy = {
  en: {
    title: "Customer reviews",
    subtitle: "Read recent customer feedback or share your own product experience.",
    empty: "No customer reviews yet.",
    rating: "Rating",
    comment: "Review",
    placeholder: "Share what stood out about this product",
    submit: "Submit review",
    saving: "Saving...",
    saved: "Review saved",
    pending: "Review submitted for approval.",
    signIn: "Sign in to leave a review.",
    failed: "Unable to save review."
  },
  ar: {
    title: "تقييمات العملاء",
    subtitle: "اقرأ آراء العملاء أو شارك تجربتك مع المنتج.",
    empty: "لا توجد تقييمات بعد.",
    rating: "التقييم",
    comment: "المراجعة",
    placeholder: "اكتب ما أعجبك في هذا المنتج",
    submit: "إرسال التقييم",
    saving: "جار الحفظ...",
    saved: "تم حفظ التقييم",
    pending: "تم إرسال التقييم للمراجعة.",
    signIn: "سجل الدخول لإضافة تقييم.",
    failed: "تعذر حفظ التقييم."
  }
};

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Dubai"
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProductReviews({
  productId,
  productSlug,
  locale,
  initialRating,
  initialReviewCount,
  initialReviews
}: ProductReviewsProps) {
  const router = useRouter();
  const labels = copy[locale];
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, comment })
      });
      const result = await response.json();

      if (response.status === 401) {
        toast.error(labels.signIn);
        router.push(`/${locale}/login?callbackUrl=/${locale}/product/${productSlug}`);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error ?? labels.failed);
      }

      setRating(Number(result.rating ?? rating));
      setReviewCount(Number(result.reviewCount ?? reviewCount));
      if (result.pending) {
        setPendingNotice(labels.pending);
      } else {
        setReviews((current) => [
          result.review,
          ...current.filter((review) => review.id !== result.review.id)
        ]);
      }
      setComment("");
      toast.success(result.pending ? labels.pending : labels.saved);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-16 grid gap-8 lg:grid-cols-[360px_1fr]">
      <div className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft lg:sticky lg:top-28">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">{labels.title}</p>
        <div className="mt-4 flex items-end gap-3">
          <span className="text-4xl font-bold text-navy">{rating.toFixed(1)}</span>
          <span className="pb-1 text-sm font-semibold text-neutral-500">
            {reviewCount} {locale === "ar" ? "تقييم" : "reviews"}
          </span>
        </div>
        <div className="mt-3 flex gap-1 text-gold-500">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={18}
              className={index < Math.round(rating) ? "fill-gold-400" : "text-neutral-300"}
            />
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-600">{labels.subtitle}</p>

        <form onSubmit={submitReview} className="mt-5 grid gap-4">
          <div>
            <p className="text-sm font-semibold text-navy">{labels.rating}</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRating(value)}
                    className="grid h-9 w-9 place-items-center rounded-md hover:bg-gold-50"
                    aria-label={`${labels.rating} ${value}`}
                  >
                    <Star
                      size={20}
                      className={cn(
                        "text-gold-500",
                        value <= selectedRating ? "fill-gold-400" : "text-neutral-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-navy">
            {labels.comment}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              required
              minLength={4}
              rows={4}
              placeholder={labels.placeholder}
              className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm text-neutral-700"
            />
          </label>
          {pendingNotice ? <p className="text-sm font-semibold text-emerald-700">{pendingNotice}</p> : null}
          <Button type="submit" disabled={saving}>
            <Send size={16} />
            {saving ? labels.saving : labels.submit}
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-100 text-sm font-bold text-navy">
                    {initials(review.user.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-navy">{review.user.name}</h3>
                    <p className="text-xs font-semibold text-neutral-400">{formatDate(review.createdAt, locale)}</p>
                  </div>
                </div>
                <div className="flex gap-1 text-gold-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={15}
                      className={index < review.rating ? "fill-gold-400" : "text-neutral-300"}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-600">{review.comment}</p>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-500 shadow-soft">
            {labels.empty}
          </div>
        )}
      </div>
    </section>
  );
}
