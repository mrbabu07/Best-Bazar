"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { safeResponseJson } from "@/lib/safe-json";

type AdminReviewActionsProps = {
  reviewId: string;
  isApproved: boolean;
};

export function AdminReviewActions({ reviewId, isApproved }: AdminReviewActionsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const updateStatus = async (nextApproved: boolean) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: nextApproved })
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to update review.");
      }

      toast.success(nextApproved ? "Review approved" : "Review hidden");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => updateStatus(!isApproved)}
        disabled={saving}
        className="grid h-9 w-9 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 disabled:opacity-60"
        aria-label={isApproved ? "Hide review" : "Approve review"}
      >
        {isApproved ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
      </button>
      <AdminDeleteButton
        endpoint={`/api/admin/reviews/${reviewId}`}
        label="Delete this review?"
        successMessage="Review deleted"
      />
    </div>
  );
}
