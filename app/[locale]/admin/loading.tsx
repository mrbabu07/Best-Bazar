import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-gold-600" />
        <p className="mt-4 text-sm font-semibold text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}
