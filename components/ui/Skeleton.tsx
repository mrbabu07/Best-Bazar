import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200/80", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-[386px] flex-col rounded-lg border border-neutral-200 bg-white p-3 shadow-soft sm:h-[470px] lg:h-[500px]">
      <Skeleton className="h-[174px] w-full sm:h-[260px] lg:h-[280px]" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-auto h-10 w-full" />
    </div>
  );
}
