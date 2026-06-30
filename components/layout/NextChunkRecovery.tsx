"use client";

import { useEffect } from "react";

const reloadStorageKey = "best-mart-next-chunk-reload-at";
const reloadCooldownMs = 10_000;
const browserCacheVersionKey = "best-mart-browser-cache-version";
const browserCacheVersion = "2026-06-30-footer-uae-v1";

async function clearBrowserBuildCaches() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all(registrations?.map((registration) => registration.unregister()) ?? []);
  } catch {
    // Best-effort cleanup only.
  }

  try {
    const cacheNames = await window.caches?.keys?.();
    await Promise.all(cacheNames?.map((cacheName) => window.caches.delete(cacheName)) ?? []);
  } catch {
    // Best-effort cleanup only.
  }
}

function isRecoverableNextChunkError(reason: unknown) {
  let serializedReason = "";

  try {
    serializedReason = JSON.stringify(reason ?? "");
  } catch {
    serializedReason = String(reason ?? "");
  }

  const text =
    reason instanceof Error
      ? `${reason.name} ${reason.message} ${reason.stack ?? ""}`
      : typeof reason === "string"
        ? reason
        : serializedReason;

  return (
    text.includes("Cannot read properties of undefined (reading 'call')") ||
    text.includes("ChunkLoadError") ||
    (text.includes("Cannot find module './") && text.includes(".next")) ||
    (text.includes("webpack.js") && text.includes("options.factory"))
  );
}

function reloadOnceForFreshChunks(reason: unknown) {
  if (!isRecoverableNextChunkError(reason)) {
    return;
  }

  const now = Date.now();
  const lastReload = Number(window.sessionStorage.getItem(reloadStorageKey) ?? 0);

  if (Number.isFinite(lastReload) && now - lastReload < reloadCooldownMs) {
    return;
  }

  window.sessionStorage.setItem(reloadStorageKey, String(now));
  void clearBrowserBuildCaches().finally(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("_fresh", String(now));
    window.location.replace(url.toString());
  });
}

export function NextChunkRecovery() {
  useEffect(() => {
    let storedCacheVersion = "";

    try {
      storedCacheVersion = window.localStorage.getItem(browserCacheVersionKey) ?? "";
    } catch {
      // Continue without persistent version tracking when storage is unavailable.
    }

    if (storedCacheVersion !== browserCacheVersion) {
      try {
        window.localStorage.setItem(browserCacheVersionKey, browserCacheVersion);
      } catch {
        // Cache cleanup and the one-time URL marker still prevent a reload loop.
      }
      void clearBrowserBuildCaches().finally(() => {
        const url = new URL(window.location.href);

        if (url.searchParams.get("_cache") !== browserCacheVersion) {
          url.searchParams.set("_cache", browserCacheVersion);
          window.location.replace(url.toString());
        }
      });
    } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      void clearBrowserBuildCaches();
    }

    const clearSuccessfulLoad = window.setTimeout(() => {
      window.sessionStorage.removeItem(reloadStorageKey);
    }, reloadCooldownMs);

    const handleError = (event: ErrorEvent) => {
      reloadOnceForFreshChunks(event.error ?? event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reloadOnceForFreshChunks(event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.clearTimeout(clearSuccessfulLoad);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
