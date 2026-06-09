import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-6 h-12 w-3/4" />
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-3 h-5 w-5/6" />
          <Skeleton className="mt-8 h-12 w-52" />
          <Skeleton className="mt-8 h-28 w-full" />
        </div>
      </div>
    </main>
  );
}
