"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { NextChunkRecovery } from "@/components/layout/NextChunkRecovery";
import type { StorefrontFrameProps } from "@/components/layout/types";

const StorefrontFrame = dynamic(() =>
  import("@/components/layout/StorefrontFrame").then((module) => module.StorefrontFrame)
);

export type { StorefrontFrameSettings } from "@/components/layout/types";

export function AppFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const pathname = usePathname();
  const currentPathname = pathname ?? `/${locale}`;
  const isAdmin = currentPathname.includes(`/${locale}/admin`);

  if (isAdmin) {
    return (
      <div className="min-h-screen">
        <NextChunkRecovery />
        {children}
      </div>
    );
  }

  return (
    <StorefrontFrame locale={locale} dictionary={dictionary} settings={settings}>
      <NextChunkRecovery />
      {children}
    </StorefrontFrame>
  );
}
