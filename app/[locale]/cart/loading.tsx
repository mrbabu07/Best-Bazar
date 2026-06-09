import { Skeleton } from "@/components/ui/Skeleton";

export default function CartLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="mt-5 h-9 w-56" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[120px_1fr_auto]">
              <Skeleton className="aspect-square" />
              <div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-6 w-64 max-w-full" />
                <Skeleton className="mt-4 h-5 w-24" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          ))}
        </section>
        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-5 h-11 w-full" />
          <Skeleton className="mt-5 h-40 w-full" />
          <Skeleton className="mt-5 h-32 w-full" />
          <Skeleton className="mt-6 h-12 w-full" />
        </aside>
      </div>
    </main>
  );
}
