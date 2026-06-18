"use client";

import { useEffect } from "react";

const reloadStorageKey = "best-mart-next-chunk-reload-at";
const reloadCooldownMs = 10_000;

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
  window.location.reload();
}

export function NextChunkRecovery() {
  useEffect(() => {
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
