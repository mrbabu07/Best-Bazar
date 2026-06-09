import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="mt-5 h-10 w-56" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-48 max-w-full" />
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </aside>
        <section className="grid gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-72 w-full" />
        </section>
      </div>
    </main>
  );
}
