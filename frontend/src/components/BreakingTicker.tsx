import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Container } from "@/components/Container";
import type { Story } from "@/types/story";

export function BreakingTicker({ stories }: { stories: Story[] | undefined }) {
  const reduce = useReducedMotion();
  return (
    <div className="border-b border-border bg-surface-alt" aria-label="Breaking news">
      <Container className="flex h-11 items-center gap-4">
        <span className="font-label flex shrink-0 items-center gap-2 bg-signal px-2.5 py-1 text-sm leading-none text-signal-foreground">
          Breaking
        </span>
        <div className="marquee relative min-w-0 flex-1 overflow-hidden">
          {!stories ? (
            <div className="skeleton h-4 w-2/3" />
          ) : reduce ? (
            <Link
              to={`/news/${stories[0]!.slug}`}
              className="block truncate text-sm font-medium hover:text-signal"
            >
              {stories[0]!.title}
            </Link>
          ) : (
            <div className="marquee-track flex w-max">
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                  {stories.map((s) => (
                    <li key={s._id} className="flex items-center">
                      <Link
                        to={`/news/${s.slug}`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="whitespace-nowrap px-6 text-sm font-medium transition-colors hover:text-signal"
                      >
                        {s.title}
                      </Link>
                      <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground" />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
