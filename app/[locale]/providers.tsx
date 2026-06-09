"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
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
