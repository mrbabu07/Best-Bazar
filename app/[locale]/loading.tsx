import { Skeleton } from "@/components/ui/Skeleton";

export default function LocaleLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5]" />
        ))}
      </div>
    </main>
  );
}
