import { Skeleton } from "@/components/ui/Skeleton";

export default function OrderConfirmationLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-28" />
      <div className="mt-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="mt-5 h-10 w-72 max-w-full" />
            <Skeleton className="mt-3 h-5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-20 w-52" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="mt-8 h-64 w-full" />
        <div className="mt-8 flex gap-3">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </main>
  );
}
