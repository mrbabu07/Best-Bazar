import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="mt-5 h-9 w-52" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px]">
        <section className="grid gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <Skeleton className="h-7 w-48" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
              <Skeleton className="h-32 w-full sm:col-span-2" />
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <Skeleton className="h-7 w-44" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </section>
        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-5 h-32 w-full" />
          <Skeleton className="mt-5 h-40 w-full" />
          <Skeleton className="mt-6 h-12 w-full" />
        </aside>
      </div>
    </main>
  );
}
