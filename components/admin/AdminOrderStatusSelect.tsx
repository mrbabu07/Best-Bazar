"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type OrderStatus = (typeof statuses)[number];

type AdminOrderStatusSelectProps = {
  orderId: string;
  initialStatus: OrderStatus;
};

export function AdminOrderStatusSelect({ orderId, initialStatus }: AdminOrderStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (nextStatus: OrderStatus) => {
    const previousStatus = status;
    setStatus(nextStatus);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: nextStatus })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update order status.");
      }

      toast.success("Order status updated");
      router.refresh();
    } catch (error) {
      setStatus(previousStatus);
      toast.error(error instanceof Error ? error.message : "Unable to update order status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(event) => updateStatus(event.target.value as OrderStatus)}
      disabled={saving}
      className="h-9 rounded-md border border-neutral-200 bg-paper px-2 text-sm disabled:opacity-60"
    >
      {statuses.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  );
}
