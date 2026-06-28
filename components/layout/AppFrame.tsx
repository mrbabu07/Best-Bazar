"use client";

import { usePathname } from "next/navigation";
import { MaintenanceScreen } from "@/components/layout/MaintenanceScreen";
import { NextChunkRecovery } from "@/components/layout/NextChunkRecovery";
import { StorefrontFrame } from "@/components/layout/StorefrontFrame";
import type { StorefrontFrameProps } from "@/components/layout/types";

export type { StorefrontFrameSettings } from "@/components/layout/types";

export function AppFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const pathname = usePathname();
  const currentPathname = pathname ?? `/${locale}`;
  const isAdmin = currentPathname.includes(`/${locale}/admin`);
  const isParcelDetails = currentPathname.includes(`/${locale}/parcel/`);
  const maintenanceMode = settings.themeSettings.maintenanceMode;

  if (isAdmin || isParcelDetails) {
    return (
      <div className="min-h-screen">
        <NextChunkRecovery />
        {children}
      </div>
    );
  }

  if (maintenanceMode) {
    return (
      <>
        <NextChunkRecovery />
        <MaintenanceScreen locale={locale} settings={settings} />
      </>
    );
  }

  return (
    <StorefrontFrame locale={locale} dictionary={dictionary} settings={settings}>
      <NextChunkRecovery />
      {children}
    </StorefrontFrame>
  );
}
