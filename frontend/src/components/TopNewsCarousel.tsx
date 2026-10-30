// src/components/TopNewsCarousel.tsx
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/Container";
import { TranslatedHighlightedText } from "@/components/TranslatedHighlightedText";
import { CarouselSkeleton } from "@/components/States";
import { StoryImage } from "@/components/StoryImage";
import { StoryMeta } from "@/components/StoryBits";
import { cn } from "@/lib/utils";
import type { Story } from "@/types/story";

interface TopNewsCarouselProps {
  stories: Story[] | undefined;
  className?: string;
}

function CarouselCard({ story, tabIndex }: { story: Story; tabIndex?: number }) {
  const { t } = useTranslation();
  return (
    <article className="group relative flex h-full min-w-0 flex-col select-none">
      <StoryImage
        src={story.imageUrl}
        alt={story.title}
        ratio="16/9"
        badge={story.isBreaking ? t("breaking") : undefined}
      />
      <div className="mt-2.5 flex flex-1 flex-col">
        <h3 className="headline min-h-[3.9em] line-clamp-3 text-[0.9375rem] font-[650] leading-[1.3] text-foreground">
          <Link
            to={`/news/${story.slug}`}
            tabIndex={tabIndex}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-signal"
          >
            <span className="link-underline">
              {/* 👇 Changed from TranslatedText to TranslatedHighlightedText */}
              <TranslatedHighlightedText text={story.title} />
            </span>
          </Link>
        </h3>
        <div className="mt-auto pt-1.5">
          <StoryMeta story={story} />
        </div>
      </div>
    </article>
  );
}

export function TopNewsCarousel({ stories, className }: TopNewsCarouselProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollSnapRef = useRef<HTMLUListElement>(null);

  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDocHidden, setIsDocHidden] = useState(false);
  const [isOffscreen, setIsOffscreen] = useState(false);
  const [isCooldownPaused, setIsCooldownPaused] = useState(false);

  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const singleWidthRef = useRef<number>(0);

  const x = useMotionValue(0);

  const items = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    let list = stories;
    while (list.length < 8) {
      list = [...list, ...stories];
    }
    return list;
  }, [stories]);

  const triggerCooldown = useCallback((delayMs: number = 1200) => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    setIsCooldownPaused(true);
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldownPaused(false);
    }, delayMs);
  }, []);

  const wrapX = useCallback(() => {
    const width = singleWidthRef.current;
    if (width <= 0) return;
    let currentX = x.get();
    while (currentX <= -width) {
      currentX += width;
    }
    while (currentX > 0) {
      currentX -= width;
    }
    x.set(currentX);
  }, [x]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const firstChild = track.children[0] as HTMLElement | undefined;
      if (firstChild) {
        singleWidthRef.current = firstChild.getBoundingClientRect().width;
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOffscreen(!entry?.isIntersecting);
      },
      { threshold: 0.05 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const onPointerEnter = useCallback(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsHovered(true);
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    setIsHovered(false);
    triggerCooldown(1200);
  }, [triggerCooldown]);

  const onFocusIn = useCallback(() => {
    setIsFocused(true);
  }, []);

  const onFocusOut = useCallback(
    (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
        triggerCooldown(1200);
      }
    },
    [triggerCooldown],
  );

  const isPaused =
    reduce ||
    isManuallyPaused ||
    isHovered ||
    isFocused ||
    isPointerDown ||
    isDocHidden ||
    isOffscreen ||
    isCooldownPaused;

  useAnimationFrame((_, delta) => {
    if (isPaused) return;
    const width = singleWidthRef.current;
    if (width <= 0) return;

    const isMobile = window.innerWidth < 768;
    const speed = isMobile ? 28 : 36;
    const dt = delta / 1000;

    let currentX = x.get() - speed * dt;
    while (currentX <= -width) {
      currentX += width;
    }
    while (currentX > 0) {
      currentX -= width;
    }
    x.set(currentX);
  });

  const getCardStep = useCallback(() => {
    const width = window.innerWidth;
    const cardWidth = width >= 1280 ? 240 : width >= 768 ? 220 : 200;
    return cardWidth + 16;
  }, []);

  const stepBy = useCallback(
    (direction: "prev" | "next") => {
      const step = getCardStep();
      const delta = direction === "next" ? -step : step;

      if (reduce && scrollSnapRef.current) {
        scrollSnapRef.current.scrollBy({ left: -delta, behavior: "smooth" });
        return;
      }

      triggerCooldown(3000);
      if (animControlsRef.current) animControlsRef.current.stop();

      wrapX();
      const targetX = x.get() + delta;

      animControlsRef.current = animate(x, targetX, {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: wrapX,
        onComplete: wrapX,
      });
    },
    [getCardStep, reduce, triggerCooldown, wrapX, x],
  );

  const handlePrev = useCallback(() => stepBy("prev"), [stepBy]);
  const handleNext = useCallback(() => stepBy("next"), [stepBy]);

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={t("home.topNews")}
      className={cn("relative py-6 sm:py-8", className)}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <Container>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-[18px] w-1 shrink-0 rounded-[1px] bg-signal" aria-hidden />
            <h2 className="headline text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-foreground">
              {t("home.topNews")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isManuallyPaused ? "Play top news carousel" : "Pause top news carousel"}
              aria-pressed={isManuallyPaused}
              onClick={() => setIsManuallyPaused((p) => !p)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-signal hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              {isManuallyPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>

            <button
              type="button"
              aria-label="Previous top story"
              onClick={handlePrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-signal hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Next top story"
              onClick={handleNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-signal hover:text-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <Link
              to="/archive"
              className="ml-2 hidden text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-signal sm:inline-block"
            >
              {t("home.seeAll")}
            </Link>
          </div>
        </div>

        {!stories ? (
          <CarouselSkeleton count={5} />
        ) : reduce ? (
          <ul
            ref={scrollSnapRef}
            tabIndex={0}
            aria-label={t("home.topNews")}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            {items.map((s, idx) => (
              <li
                key={`${s._id}-${idx}`}
                className="w-[200px] shrink-0 snap-start sm:w-[220px] xl:w-[240px]"
              >
                <CarouselCard story={s} />
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)",
            }}
          >
            <motion.div
              ref={trackRef}
              style={{ x, touchAction: "pan-y" }}
              onPointerDown={() => setIsPointerDown(true)}
              onPointerUp={() => {
                setIsPointerDown(false);
                triggerCooldown(1200);
              }}
              onPan={(_, info) => {
                wrapX();
                x.set(x.get() + info.delta.x);
                wrapX();
              }}
              onPanEnd={() => {
                triggerCooldown(1200);
              }}
              className="flex w-max"
            >
              <ul className="flex shrink-0 gap-4 pr-4">
                {items.map((s, idx) => (
                  <li
                    key={`${s._id}-${idx}`}
                    className="w-[200px] shrink-0 sm:w-[220px] xl:w-[240px]"
                  >
                    <CarouselCard story={s} />
                  </li>
                ))}
              </ul>

              <ul aria-hidden className="flex shrink-0 gap-4 pr-4">
                {items.map((s, idx) => (
                  <li
                    key={`${s._id}-dup-${idx}`}
                    className="w-[200px] shrink-0 sm:w-[220px] xl:w-[240px]"
                  >
                    <CarouselCard story={s} tabIndex={-1} />
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </Container>
    </section>
  );
}