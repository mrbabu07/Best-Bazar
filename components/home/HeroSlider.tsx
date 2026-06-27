"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  isPortrait?: boolean;
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
  const activeSlides = useMemo(() => (slides.length ? slides : [fallbackSlide]), [fallbackSlide, slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = activeSlides[activeIndex] ?? activeSlides[0];
  const showControls = activeSlides.length > 1;

  useEffect(() => {
    for (const slide of activeSlides) {
      for (const source of [slide.desktopImage, slide.mobileImage]) {
        if (source) {
          const image = new window.Image();
          image.src = source;
        }
      }
    }
  }, [activeSlides]);

  useEffect(() => {
    if (!showControls) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % activeSlides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [activeSlides.length, showControls]);

  const goToPrevious = () => {
    setActiveIndex((index) => (index === 0 ? activeSlides.length - 1 : index - 1));
  };

  const goToNext = () => {
    setActiveIndex((index) => (index + 1) % activeSlides.length);
  };

  return (
    <section className="relative overflow-hidden bg-[#f3f1e8]">
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
              className="absolute inset-0 h-full w-full object-cover object-center sm:hidden"
            />
          ) : null}
          <video
            key={`${activeSlide.id}-desktop`}
            src={activeSlide.desktopImage}
            autoPlay
            loop
            muted
            playsInline
            className={activeSlide.mobileImage ? "absolute inset-0 hidden h-full w-full object-cover object-center sm:block" : "absolute inset-0 h-full w-full object-cover object-center"}
          />
        </>
      ) : activeSlide.isPortrait ? (
        <>
          {activeSlide.mobileImage ? (
            <Image
              key={`${activeSlide.id}-mobile`}
              src={activeSlide.mobileImage}
              alt={activeSlide.title}
              fill
              priority
              unoptimized={activeSlide.mobileImage.includes("res.cloudinary.com")}
              sizes="(max-width: 639px) 100vw, 1px"
              className="object-cover object-center sm:hidden"
            />
          ) : null}
          <div className="absolute inset-0 hidden overflow-hidden bg-[#8f674f] sm:block">
            <Image
              key={`${activeSlide.id}-desktop-background`}
              src={activeSlide.desktopImage}
              alt=""
              fill
              unoptimized={activeSlide.desktopImage.includes("res.cloudinary.com")}
              aria-hidden="true"
              sizes="100vw"
              className="scale-110 object-cover blur-2xl"
            />
            <div className="absolute inset-0 bg-black/15" />
            <Image
              key={`${activeSlide.id}-desktop`}
              src={activeSlide.desktopImage}
              alt={activeSlide.title}
              fill
              unoptimized={activeSlide.desktopImage.includes("res.cloudinary.com")}
              sizes="100vw"
              className="object-contain object-center"
            />
          </div>
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
              unoptimized={activeSlide.mobileImage.includes("res.cloudinary.com")}
              sizes="(max-width: 639px) 100vw, 1px"
              className="object-cover object-center sm:hidden"
            />
          ) : null}
          <Image
            key={`${activeSlide.id}-desktop`}
            src={activeSlide.desktopImage}
            alt={activeSlide.title}
            fill
            priority
            unoptimized={activeSlide.desktopImage.includes("res.cloudinary.com")}
            sizes={activeSlide.mobileImage ? "(min-width: 640px) 100vw, 1px" : "100vw"}
            className={activeSlide.mobileImage ? "hidden object-cover object-center sm:block" : "object-cover object-center"}
          />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-end px-5 py-10 sm:min-h-[600px] sm:px-10 sm:py-12 lg:min-h-[680px] lg:px-14">
        <div className="max-w-xl text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">{eyebrow}</p>
          <h1 className="font-editorial mt-3 max-w-[calc(100vw-2.5rem)] break-words text-[2.25rem] font-semibold leading-none sm:max-w-xl sm:text-6xl lg:text-7xl">{activeSlide.title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/90 sm:text-base">{activeSlide.subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={activeSlide.href}
              className="inline-flex h-12 items-center rounded-md bg-[#d1bd76] px-8 text-sm font-semibold text-white transition hover:bg-[#bba55d]"
            >
              {activeSlide.buttonText}
            </Link>
            <Link
              href={secondaryHref}
              className="hidden h-12 items-center rounded-md border border-white/80 px-7 text-sm font-semibold text-white transition hover:bg-white hover:text-neutral-950 sm:inline-flex"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      {showControls ? (
        <>
          <div className="absolute bottom-5 right-5 flex items-center gap-3 text-white sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${locale === "ar" ? "انتقل إلى الشريحة" : "Go to slide"} ${index + 1}`}
                className={`h-2.5 rounded-full transition ${
                  index === activeIndex ? "w-2.5 bg-white" : "w-2.5 border border-white/80 bg-white/20 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 gap-3 sm:flex rtl:left-5 rtl:right-auto">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label={locale === "ar" ? "الشريحة السابقة" : "Previous slide"}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <ChevronLeft size={22} className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label={locale === "ar" ? "الشريحة التالية" : "Next slide"}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <ChevronRight size={22} className="rtl:rotate-180" />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
