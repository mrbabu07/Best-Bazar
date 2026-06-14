"use client";

import { useOrderTracking } from "@/lib/socket-client";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";

type OrderTrackerProps = {
  orderId: string;
  currentStatus: string;
};

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
};

/**
 * Real-time order tracking component
 * Updates automatically when order status changes
 */
export function OrderTracker({ orderId, currentStatus }: OrderTrackerProps) {
  const { orderStatus, isConnected } = useOrderTracking(orderId);
  
  // Use real-time status if available, otherwise fallback to prop
  const status = orderStatus || currentStatus;
  const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold-100 text-gold-700">
            <Icon size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500">Order Status</p>
            <p className="font-bold text-navy">{status}</p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live
          </div>
        )}
      </div>
    </div>
  );
}
