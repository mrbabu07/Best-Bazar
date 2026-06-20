"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  href: string;
  desktopImage: string;
  mobileImage?: string;
  isVideo?: boolean;
};

type HeroSliderProps = {
  locale: Locale;
  eyebrow: string;
  slides: HeroSlide[];
  fallbackSlide: HeroSlide;
  secondaryHref: string;
  secondaryLabel: string;
  metrics: string[];
};

export function HeroSlider({
  locale,
  eyebrow,
  slides,
  fallbackSlide,
  secondaryHref,
  secondaryLabel,
  metrics
}: HeroSliderProps) {
  void metrics;
  const activeSlides = slides.length ? slides : [fallbackSlide];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = activeSlides[activeIndex] ?? activeSlides[0];
  const showControls = activeSlides.length > 1;

  useEffect(() => {
    if (!showControls) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % activeSlides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [activeSlides.length, showControls]);

  const goToPrevious = () => {
    setActiveIndex((index) => (index === 0 ? activeSlides.length - 1 : index - 1));
  };

  const goToNext = () => {
    setActiveIndex((index) => (index + 1) % activeSlides.length);
  };

  return (
    <section className="relative min-h-[390px] overflow-hidden sm:min-h-[540px] lg:min-h-[620px]">
      {/* Background Media */}
      {activeSlide.isVideo ? (
        <>
          {activeSlide.mobileImage ? (
            <video
              key={`${activeSlide.id}-mobile`}
              src={activeSlide.mobileImage}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover sm:hidden"
            />
          ) : null}
          <video
            key={`${activeSlide.id}-desktop`}
            src={activeSlide.desktopImage}
            autoPlay
            loop
            muted
            playsInline
            className={activeSlide.mobileImage ? "absolute inset-0 hidden h-full w-full object-cover sm:block" : "absolute inset-0 h-full w-full object-cover"}
          />
        </>
      ) : (
        <>
          {activeSlide.mobileImage ? (
            <Image
              key={`${activeSlide.id}-mobile`}
              src={activeSlide.mobileImage}
              alt={activeSlide.title}
              fill
              priority
              sizes="(max-width: 639px) 100vw, 1px"
              className="object-cover sm:hidden"
            />
          ) : null}
          <Image
            key={`${activeSlide.id}-desktop`}
            src={activeSlide.desktopImage}
            alt={activeSlide.title}
            fill
            priority
            sizes={activeSlide.mobileImage ? "(min-width: 640px) 100vw, 1px" : "100vw"}
            className={activeSlide.mobileImage ? "hidden object-cover sm:block" : "object-cover"}
          />
        </>
      )}
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative mx-auto flex min-h-[390px] max-w-7xl items-end px-4 py-8 sm:min-h-[540px] sm:px-6 sm:py-12 lg:min-h-[620px] lg:px-8">
        <div className="max-w-xl text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{activeSlide.title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/90 sm:text-base">{activeSlide.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={activeSlide.href}
              className="inline-flex h-11 items-center bg-neutral-950 px-7 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {activeSlide.buttonText}
            </Link>
            <Link
              href={secondaryHref}
              className="hidden h-11 items-center border border-white/70 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-neutral-950 sm:inline-flex"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      {showControls ? (
        <>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${locale === "ar" ? "انتقل إلى الشريحة" : "Go to slide"} ${index + 1}`}
                className={`h-2.5 rounded-full transition ${
                  index === activeIndex ? "w-8 bg-gold-300" : "w-2.5 bg-white/55 hover:bg-white"
                }`}
              />
            ))}
          </div>
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 gap-2 sm:flex rtl:left-4 rtl:right-auto">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label={locale === "ar" ? "الشريحة السابقة" : "Previous slide"}
              className="grid h-11 w-11 place-items-center rounded-md border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <ChevronLeft size={22} className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label={locale === "ar" ? "الشريحة التالية" : "Next slide"}
              className="grid h-11 w-11 place-items-center rounded-md border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <ChevronRight size={22} className="rtl:rotate-180" />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
