"use client";

import { Suspense, type ReactNode } from "react";
import { NavigationFeedback } from "@/components/layout/NavigationFeedback";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationFeedback />
      </Suspense>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            border: "1px solid #ead49b",
            color: "#1A1A2E"
          }
        }}
      />
    </>
  );
}
