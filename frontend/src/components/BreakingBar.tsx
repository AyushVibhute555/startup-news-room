import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/Container";
import { TranslatedText } from "@/components/TranslatedText";
import type { Story } from "@/types/story";

interface BreakingBarProps {
  stories: Story[] | undefined;
}

export function BreakingBar({ stories }: BreakingBarProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const breakingStories = stories?.filter((s) => s.isBreaking) ?? [];

  useEffect(() => {
    if (breakingStories.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % breakingStories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingStories.length, isPaused]);

  if (breakingStories.length === 0) return null;

  const current = breakingStories[index % breakingStories.length]!;

  return (
    <div
      role="region"
      aria-label={t("breaking")}
      className="border-b border-border bg-surface-alt text-[0.8125rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Container className="flex h-10 items-center gap-3">
        <span className="inline-flex shrink-0 items-center rounded-[3px] bg-signal px-2 py-0.5 text-xs font-semibold leading-none text-signal-foreground">
          {t("breaking")}
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="truncate"
            >
              <Link
                to={`/news/${current.slug}`}
                className="font-medium text-foreground transition-colors duration-200 hover:text-signal"
              >
                <TranslatedText text={current.title} />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
}