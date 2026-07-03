"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA Install Prompt
 * Shows a banner to prompt users to install the app
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (!dismissed || Date.now() - Number(dismissed) >= sevenDays) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installed");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Check if already dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = Number(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up sm:left-auto sm:right-4">
      <div className="rounded-lg border border-gold-200 bg-white p-4 shadow-lift">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700">
            <Download size={24} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-navy">Install AyVella</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Get faster access, work offline, and enjoy native app experience
            </p>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-md bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-bold text-navy hover:bg-neutral-50"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="shrink-0 text-neutral-400 hover:text-neutral-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
