import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { Search, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReviewActions } from "@/components/admin/AdminReviewActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Review Moderation | Best Mart"
};

type AdminReviewsPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(searchParams: AdminReviewsPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildReviewWhere(searchParams: AdminReviewsPageProps["searchParams"]) {
  const search = readParam(searchParams, "search")?.trim();
  const status = readParam(searchParams, "status");

  return {
    ...(status === "approved" ? { isApproved: true } : {}),
    ...(status === "pending" ? { isApproved: false } : {}),
    ...(search
      ? {
          OR: [
            { comment: { contains: search, mode: "insensitive" } },
            { product: { nameEn: { contains: search, mode: "insensitive" } } },
            { product: { nameAr: { contains: search, mode: "insensitive" } } },
            { product: { sku: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  } satisfies Prisma.ReviewWhereInput;
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function AdminReviewsPage({ params, searchParams }: AdminReviewsPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const label = dictionary.admin.reviews;
  const search = readParam(searchParams, "search") ?? "";
  const status = readParam(searchParams, "status") ?? "";
  const where = buildReviewWhere(searchParams);
  const reviews = await prisma.review.findMany({
    where,
    include: {
      product: { select: { id: true, slug: true, nameEn: true, nameAr: true, sku: true } },
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    take: 80
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow={label}
        title={label}
        subtitle="Approve, hide, search, and remove customer product reviews."
      />

      <form
        action={`/${locale}/admin/reviews`}
        className="mb-5 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_auto]"
      >
        <label className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search product, customer, or comment"
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
        <Button type="submit" variant="secondary">{dictionary.actions.apply}</Button>
      </form>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Review</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviews.map((review) => (
                <tr key={review.id} className="align-top">
                  <td className="px-5 py-4">
                    <Link
                      href={`/${locale}/product/${review.product.slug}`}
                      className="font-bold text-navy hover:text-gold-700"
                    >
                      {locale === "ar" ? review.product.nameAr : review.product.nameEn}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500">{review.product.sku}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{review.user.name ?? "Customer"}</p>
                    <p className="mt-1 text-xs text-neutral-500">{review.user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-navy">
                      <Star size={15} className="fill-gold-400 text-gold-400" />
                      {review.rating}
                    </span>
                    <p className="mt-1 text-xs text-neutral-500">{formatDate(review.createdAt, locale)}</p>
                  </td>
                  <td className="max-w-md px-5 py-4 text-neutral-600">
                    <p className="line-clamp-4 leading-6">{review.comment}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={review.isApproved ? "green" : "gold"}>
                      {review.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <AdminReviewActions reviewId={review.id} isApproved={review.isApproved} />
                  </td>
                </tr>
              ))}
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm font-semibold text-neutral-500">
                    No reviews found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
