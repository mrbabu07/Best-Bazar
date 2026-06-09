import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200/80", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-soft">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}
