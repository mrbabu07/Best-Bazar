import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-96" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
