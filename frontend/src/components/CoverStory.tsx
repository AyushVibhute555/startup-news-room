import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StoryImage } from "@/components/StoryImage";
import { StoryLink, StoryMeta, SourceLink } from "@/components/StoryBits";
import type { Story } from "@/types/story";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CoverStory({ story }: { story: Story }) {
  const reduce = useReducedMotion();
  const step = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay: i * 0.15 },
        };

  return (
    <article className="cover-story group relative">
      <motion.div {...step(0)} className="cover-story__image">
        <StoryImage src={story.imageUrl} alt={story.title} ratio="16/10" eager />
      </motion.div>
      <motion.div {...step(1)} className="cover-story__text-block">
        <span
          className={`cover-story__tag${story.isBreaking ? " cover-story__tag--breaking" : ""}`}
        >
          {story.isBreaking ? "Breaking" : "Cover Story"}
        </span>
        <h1 className="cover-story__headline">
          <StoryLink story={story}>
            <span className="link-underline">{story.title}</span>
          </StoryLink>
        </h1>
        <p className="cover-story__summary">{story.summary}</p>
        <div className="cover-story__meta-row">
          <StoryMeta story={story} readTime />
          <div className="flex items-center gap-4">
            <SourceLink story={story} />
            <span className="cover-story__cta" aria-hidden>
              Read story{" "}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </motion.div>
    </article>
  );
}
