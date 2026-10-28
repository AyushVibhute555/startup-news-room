import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SectionHeader } from "@/components/SectionHeader";
import { StoryCard } from "@/components/StoryCard";
import { StoryRow } from "@/components/StoryRow";
import { CardSkeleton, RowSkeleton } from "@/components/States";
import { getStories } from "@/lib/api";
import type { Category, Story } from "@/types/story";

interface CategoryBlockProps {
  category: Category;
  layout: "A" | "B";
}

export function CategoryBlock({ category, layout }: CategoryBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "400px", once: true });

  const [stories, setStories] = useState<Story[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let alive = true;
    setLoading(true);
    getStories({ category: category.slug, limit: 5 })
      .then((res) => {
        if (alive) {
          setStories(res.items);
        }
      })
      .catch(() => {
        if (alive) setStories([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [category.slug, isInView]);

  // Hide block if fetch returned nothing
  if (stories && stories.length === 0) return null;

  return (
    <section
      ref={containerRef}
      aria-label={category.name}
      style={{ paddingTop: "var(--section-gap)" }}
    >
      <SectionHeader
        title={category.name}
        actionLabel={`More in ${category.name}`}
        actionHref={`/category/${category.slug}`}
      />

      {loading || !stories ? (
        layout === "A" ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <CardSkeleton />
            </div>
            <div className="flex flex-col lg:col-span-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )
      ) : layout === "A" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {stories[0] && (
            <div className="lg:col-span-6">
              <StoryCard story={stories[0]} size="lg" />
            </div>
          )}
          <div className="flex flex-col lg:col-span-6">
            {stories.slice(1, 5).map((s) => (
              <StoryRow key={s._id} story={s} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stories.slice(0, 4).map((s) => (
            <StoryCard key={s._id} story={s} size="sm" />
          ))}
        </div>
      )}
    </section>
  );
}
