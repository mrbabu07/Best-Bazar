"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart } from "lucide-react";
import { useAdminSocket } from "@/lib/socket-client";
import toast from "react-hot-toast";

/**
 * Real-time notifications for admin panel
 * Shows toast notifications for new orders and status updates
 */
export function AdminRealtimeNotifications({ refreshSeconds = 60 }: { refreshSeconds?: number }) {
  const { socket, isConnected } = useAdminSocket();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) return;

    function onNewOrder(data: { orderId: string; orderNumber: string; total: number }) {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } pointer-events-auto flex w-full max-w-md rounded-lg border border-gold-200 bg-white shadow-lift`}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700">
                <ShoppingCart size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-navy">New Order Received!</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Order #{data.orderNumber} • AED {data.total}
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 5000, position: "top-right" }
      );
    }

    function onOrderStatusUpdate(data: { orderId: string; status: string }) {
      toast.success(`Order status updated to ${data.status}`, {
        duration: 3000,
        position: "top-right",
      });
    }

    function onNotification(data: { type: string; message: string; count: number }) {
      toast(data.message, {
        icon: <Bell size={20} className="text-gold-600" />,
        duration: 4000,
        position: "top-right",
      });
    }

    socket.on("order:new", onNewOrder);
    socket.on("order:statusUpdate", onOrderStatusUpdate);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("order:new", onNewOrder);
      socket.off("order:statusUpdate", onOrderStatusUpdate);
      socket.off("notification:new", onNotification);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (isConnected) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, Math.max(15, refreshSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [isConnected, refreshSeconds, router]);

  // Show connection status indicator
  return (
    <div className="fixed bottom-20 right-3 z-50 sm:right-4 lg:bottom-4">
      {isConnected && (
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live Updates Active
        </div>
      )}
    </div>
  );
}
