"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrderStatusRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [intervalSeconds, router]);

  return null;
}
