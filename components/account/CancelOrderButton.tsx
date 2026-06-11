"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { safeResponseJson } from "@/lib/safe-json";

type CancelOrderCopy = {
  cancelOrder: string;
  cancellingOrder: string;
  cancelOrderConfirm: string;
  cancelOrderSuccess: string;
  cancelOrderError: string;
};

type CancelOrderButtonProps = {
  orderId: string;
  copy: CancelOrderCopy;
};

export function CancelOrderButton({ orderId, copy }: CancelOrderButtonProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = async () => {
    if (!window.confirm(copy.cancelOrderConfirm)) {
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch(`/api/account/orders/${orderId}/cancel`, {
        method: "POST"
      });
      const result = await safeResponseJson<{ error?: string }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? copy.cancelOrderError);
      }

      toast.success(copy.cancelOrderSuccess);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.cancelOrderError);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={cancelOrder}
      disabled={cancelling}
      className="whitespace-nowrap"
    >
      <XCircle size={16} />
      {cancelling ? copy.cancellingOrder : copy.cancelOrder}
    </Button>
  );
}
