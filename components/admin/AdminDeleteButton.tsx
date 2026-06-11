"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { safeResponseJson } from "@/lib/safe-json";

type AdminDeleteButtonProps = {
  endpoint: string;
  label: string;
  successMessage: string;
};

export function AdminDeleteButton({ endpoint, label, successMessage }: AdminDeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const deleteItem = async () => {
    if (!window.confirm(label)) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await safeResponseJson<{ error?: string } | null>(response, null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to delete item.");
      }

      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={deleteItem}
      disabled={deleting}
      className="grid h-9 w-9 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50 disabled:opacity-60"
      aria-label={label}
    >
      <Trash2 size={15} />
    </button>
  );
}
