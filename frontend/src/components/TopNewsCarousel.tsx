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
import { Container } from "@/components/Container";
import { HighlightedText } from "@/components/HighlightedText";
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
  return (
    <article className="group relative flex h-full min-w-0 flex-col select-none">
      <StoryImage
        src={story.imageUrl}
        alt={story.title}
        ratio="16/10"
        badge={story.isBreaking ? "Breaking" : undefined}
      />
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="headline min-h-[4.15em] line-clamp-3 text-[1.0625rem] font-[650] leading-[1.3] text-foreground">
          <Link
            to={`/news/${story.slug}`}
            tabIndex={tabIndex}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-signal"
          >
            <span className="link-underline">
              <HighlightedText text={story.title} />
            </span>
          </Link>
        </h3>
        <div className="mt-auto pt-2">
          <StoryMeta story={story} />
        </div>
      </div>
    </article>
  );
}

export function TopNewsCarousel({ stories, className }: TopNewsCarouselProps) {
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

  // Framer motion x position
  const x = useMotionValue(0);

  // Ensure enough items to fill marquee seamlessly
  const items = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    let list = stories;
    while (list.length < 8) {
      list = [...list, ...stories];
    }
    return list;
  }, [stories]);

  // Pause helper with cooldown timer
  const triggerCooldown = useCallback((delayMs: number = 1200) => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    setIsCooldownPaused(true);
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldownPaused(false);
    }, delayMs);
  }, []);

  // Wrap x inside [-singleWidth, 0)
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

  // Measure single copy width using ResizeObserver
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const firstChild = track.children[0] as HTMLElement | undefined;
      if (firstChild) {
        // Measure first <ul> (which contains one copy of items)
        singleWidthRef.current = firstChild.getBoundingClientRect().width;
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items]);

  // Document visibility listener
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // IntersectionObserver to pause when off-screen
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

  // Fine pointer check for hover
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

  // Compute pause state
  const isPaused =
    reduce ||
    isManuallyPaused ||
    isHovered ||
    isFocused ||
    isPointerDown ||
    isDocHidden ||
    isOffscreen ||
    isCooldownPaused;

  // Animation frame loop for marquee
  useAnimationFrame((_, delta) => {
    if (isPaused) return;
    const width = singleWidthRef.current;
    if (width <= 0) return;

    // Speed: 36px/s desktop, 28px/s mobile
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

  // Calculate card step size (card width + 24px gap)
  const getCardStep = useCallback(() => {
    const width = window.innerWidth;
    const cardWidth = width >= 1280 ? 286 : width >= 768 ? 264 : 232;
    return cardWidth + 24;
  }, []);

  // Step prev / next with 0.6s cubic bezier
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
      aria-label="Top news"
      className={cn("relative py-6 sm:py-8", className)}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <Container>
        {/* Carousel Header Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-[18px] w-1 shrink-0 rounded-[1px] bg-signal" aria-hidden />
            <h2 className="headline text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-foreground">
              Top news
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
              See all
            </Link>
          </div>
        </div>

        {/* Loading state skeleton */}
        {!stories ? (
          <CarouselSkeleton count={5} />
        ) : reduce ? (
          /* Reduced-motion: native scroll-snapping row */
          <ul
            ref={scrollSnapRef}
            tabIndex={0}
            aria-label="Top stories list"
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            {items.map((s, idx) => (
              <li
                key={`${s._id}-${idx}`}
                className="w-[232px] shrink-0 snap-start sm:w-[264px] xl:w-[286px]"
              >
                <CarouselCard story={s} />
              </li>
            ))}
          </ul>
        ) : (
          /* Infinite sub-pixel smooth transform marquee */
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
              {/* Primary list */}
              <ul className="flex shrink-0 gap-6 pr-6">
                {items.map((s, idx) => (
                  <li
                    key={`${s._id}-${idx}`}
                    className="w-[232px] shrink-0 sm:w-[264px] xl:w-[286px]"
                  >
                    <CarouselCard story={s} />
                  </li>
                ))}
              </ul>

              {/* Duplicated list for seamless infinite loop (aria-hidden and non-tabbable) */}
              <ul aria-hidden className="flex shrink-0 gap-6 pr-6">
                {items.map((s, idx) => (
                  <li
                    key={`${s._id}-dup-${idx}`}
                    className="w-[232px] shrink-0 sm:w-[264px] xl:w-[286px]"
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
