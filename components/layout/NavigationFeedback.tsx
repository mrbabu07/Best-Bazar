"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isPlainInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.target ||
    anchor.hasAttribute("download")
  ) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const url = new URL(href, window.location.href);

  return (
    url.origin === window.location.origin &&
    (url.pathname !== window.location.pathname || url.search !== window.location.search)
  );
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const fallbackTimer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(fallbackTimer.current);
    setPending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const start = () => {
      window.clearTimeout(fallbackTimer.current);
      setPending(true);
      fallbackTimer.current = window.setTimeout(() => setPending(false), 8000);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;

      if (target instanceof HTMLAnchorElement && isPlainInternalNavigation(target, event)) {
        start();
      }
    };

    const handlePopState = () => start();
    const handlePageShow = () => setPending(false);

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.clearTimeout(fallbackTimer.current);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  if (!pending) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[90] h-1 overflow-hidden bg-gold-100">
        <div className="h-full w-1/2 animate-pulse bg-gold-500" />
      </div>
      <div className="fixed right-4 top-4 z-[91] inline-flex h-9 items-center gap-2 rounded-md border border-gold-200 bg-white px-3 text-xs font-bold text-navy shadow-soft rtl:left-4 rtl:right-auto">
        <LoaderCircle size={15} className="animate-spin text-gold-700" />
        Loading
      </div>
    </>
  );
}
