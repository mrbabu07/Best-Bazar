"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";
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
    <section className="relative min-h-[calc(100svh-9rem)] overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/68 to-navy/15 rtl:bg-gradient-to-l" />
      <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-white">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold-200">
            <Sparkles size={17} />
            {eyebrow}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
            <span className="inline-flex h-8 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-white backdrop-blur">
              <MapPin size={14} />
              Dubai, UAE
            </span>
            <span className="inline-flex h-8 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-white backdrop-blur">
              <ShieldCheck size={14} />
              AED checkout
            </span>
          </div>
          <h1 className="mt-5 text-5xl font-bold sm:text-6xl lg:text-7xl">{activeSlide.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/84 sm:text-lg">
            {activeSlide.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={activeSlide.href}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-6 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
            >
              {activeSlide.buttonText}
              <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-white/30 px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/10"
            >
              <Truck size={18} />
              {secondaryLabel}
            </Link>
          </div>
          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric}
                className="border-l border-gold-300/60 pl-4 text-sm font-semibold text-white/90 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4"
              >
                {metric}
              </div>
            ))}
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
