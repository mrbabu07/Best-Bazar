"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { StorefrontFrameProps } from "@/components/layout/types";

const StorefrontFrame = dynamic(() =>
  import("@/components/layout/StorefrontFrame").then((module) => module.StorefrontFrame)
);

export type { StorefrontFrameSettings } from "@/components/layout/types";

export function AppFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const pathname = usePathname();
  const isAdmin = pathname.includes(`/${locale}/admin`);

  if (isAdmin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <StorefrontFrame locale={locale} dictionary={dictionary} settings={settings}>
      {children}
    </StorefrontFrame>
  );
}
