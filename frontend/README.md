# Startup News Room

Build the complete FRONTEND ONLY for "Startup News Room", a premium, minimalist digital news platform that publishes daily startup news headlines. Each story has an image, a short summary, and a link to the original source. I'm attaching my logo (a light-grey circle with bold black condensed text "STARTUP NEWS ROOM" and a black vertical bar on the left). Use it as the favicon and in the header and footer.

Design feel: a premium editorial news site in the spirit of The New York Times, Bloomberg, Axios and The Verge. Calm, sharp, typographic and uncluttered, with generous whitespace. Content is the hero.

==================================================

1. TECH RULES (strict)
   \==================================================

- React + TypeScript + Vite + Tailwind CSS. Use shadcn/ui only where needed (Sheet, Dialog, Input, Button, Sonner toast). Icons from lucide-react.
- Routing: react-router-dom only. Do NOT use TanStack Router, TanStack Start or TanStack Query.
- Motion: framer-motion for reveal effects and lenis for smooth scrolling. Nothing else.
- NO backend, NO Supabase, NO auth, NO database. All data comes from a mock layer.
- Folder structure: src/components, src/pages, src/data, src/lib, src/types. Keep components pure and presentational, with no data fetching inside components except through the api layer in src/lib/api.ts. This is so I can later port to Next.js (App Router) and swap mock data for an Express + MongoDB API in one file.

================================================== 2. DATA LAYER (mirrors my future MongoDB schema)
==================================================

Story type: _id, title, slug, summary (2-3 sentences), content (optional extra paragraph), imageUrl, imageCredit, sourceName, sourceUrl, category, tags[], publishedAt (ISO), readTime (minutes), isFeatured, isBreaking.

Create src/lib/api.ts with async functions, each simulating about 300ms latency and carrying a comment "// TODO: replace with fetch() to Express API":
getStories({ category, q, page, limit }), getFeaturedStory(), getTopStories(), getBreakingStories(), getStoryBySlug(slug), getRelatedStories(slug), getCategories().

Mock data in src/data/stories.ts: 24 stories spread across the categories. Use CLEARLY FICTIONAL startup names and example.com source URLs (no real company claims). Use royalty-free Unsplash image URLs (images.unsplash.com with ?auto=format&fit=crop&w=1200&q=80). Generate publishedAt relative to the current date at runtime, so "Today" and "2h ago" always look right.
Categories: Funding, Launches, AI, Fintech, SaaS, Founders, Markets, Policy.

================================================== 3. DESIGN SYSTEM (solid colors only, ZERO gradients)
==================================================

No gradients, no shadows, no glassmorphism, no blur. Depth comes only from 1px hairline borders and whitespace. Define everything as CSS variables in index.css (HSL for Tailwind) and map them in tailwind.config.

Light theme:

- background (paper): #FAFAF8
- surface-alt: #F0F0EC
- ink (text): #0A0A0A
- muted text: #5C5C57
- border (hairline): #E3E3DE
- logo-grey (image fallback): #D9D9D9
- accent (Signal Red): #D42A24, used ONLY for the LIVE dot, "Breaking" tag, active nav underline and link hover
- inverse-bg: #0A0A0A and inverse-fg: #FAFAF8 (newsletter block and footer)

Dark theme (toggle in the header, saved with next-themes, defaults to the system setting):

- background #0B0B0B, surface-alt #141414, ink #F4F4F0, muted #A1A19B, border #262626, accent #FF5A4F, inverse-bg #141414, inverse-fg #F4F4F0.

Typography (Google Fonts, self-hosted via fontsource if possible, with font-display: swap):

- Brand and labels: "Barlow Condensed" 700, UPPERCASE, tracking 0.04em. Used for section labels, category tags, nav items and the "STARTUP NEWS ROOM" wordmark feel. It echoes my logo.
- Headlines: "Source Serif 4" 600/700, tight leading (1.1-1.2), -0.01em tracking.
- Body and UI: "Inter" 400/500/600.
- Fluid sizes with clamp(): hero headline clamp(2rem, 4.2vw, 3.5rem), card headline 1.125-1.375rem, body 1rem/1.65.

Shape and spacing:

- 8px spacing scale. Section vertical padding 64px mobile / 96px desktop.
- Radius: 2px for images and cards, 4px for buttons and inputs. Sharp editorial corners.
- Buttons: solid fills only. Primary = ink background with paper text, hover = accent background with white text. Secondary = 1px ink border, hover fills ink. Height 44px minimum, 150-200ms color transitions, active:scale-[0.98].
- ONE shared <Container> component (max-w 1280px, mx-auto, px-4 sm:px-6 lg:px-8) used by every section so everything aligns perfectly. Use a 12-column grid with a consistent 24px gap on desktop.

================================================== 4. PAGES AND LAYOUT
==================================================

GLOBAL HEADER

- Top utility bar (thin, hairline bottom border): today's date, formatted live in JS (e.g. "Monday, 26 October 2026"), a pulsing red "LIVE" dot, and a LinkedIn link to https://www.linkedin.com/company/startup-news-room/. Hide the LinkedIn link on small mobile.
- Main sticky header: logo (44px circle) on the left. Desktop centre nav: All, Funding, Launches, AI, Fintech, SaaS, Founders, Markets, Policy. Right side: search icon, theme toggle, and a "Subscribe" primary button. The active nav item has a 2px accent underline that slides between items. The header hides on scroll down and reappears on scroll up (transform only), with a hairline bottom border.
- Mobile (<1024px): logo, search and a hamburger that opens a full-height Sheet with large stacked category links, the theme toggle and a subscribe button.
- Search icon opens a full-screen overlay input. Submitting goes to /search?q=.
- Skip-to-content link.

BREAKING TICKER (below the header on the home page)

- A slim bar with a red "BREAKING" label and a smooth, continuously scrolling marquee of breaking headlines (CSS transform animation, pauses on hover and focus, disabled under prefers-reduced-motion, where it becomes a static single headline).

HOME (/)

1. Hero: 12-col grid. Left (8 cols) is the featured story: large 16:9 image, category tag, big serif headline, 2-line summary, source + time + read time, and a "Read story" link. Right (4 cols) is "Top Stories", a numbered list of 5 compact items (number in Barlow Condensed, headline, source and time) separated by hairlines. On mobile it stacks, with the featured story first.
2. "Latest Headlines": a responsive card grid (1 col mobile, 2 tablet, 3 desktop) of 9 story cards.
3. "Today's Briefing": a dense text-only list (time on the left, headline, source), Axios/Techmeme style, in a two-column layout on desktop.
4. Category sections for Funding, AI and Fintech: each has a label row with a "View all →" link, then one large story plus 3 small ones.
5. Newsletter block: full-width inverse-bg section with a headline "The day's startup news, in your inbox.", an email input and a Subscribe button. UI only, validated with zod + react-hook-form, shows a success toast, and has a TODO comment for the API.
6. Footer: inverse-bg, with the logo, a one-line description, link columns (Categories, Company, Legal), a LinkedIn link, and "© 2026 Startup News Room".

STORY CARD (reusable)

- Image with a fixed aspect-ratio 16:10 and object-cover, a category tag (Barlow Condensed uppercase), the serif headline, a 2-line clamped summary, and "Source Name · 2h ago".
- The whole card links to the internal story page using the stretched-link pattern. The external source link is a separate small "Source ↗" link that is NOT nested inside another anchor, so there's no invalid HTML.
- Hover: image scales to 1.04 over 700ms, the headline gets an animated underline (background-size transition), and the arrow nudges.
- If an image fails to load, show a solid #D9D9D9 block with the logo mark centred.

STORY PAGE (/news/:slug)

- Breadcrumb, category tag, full headline (no clamping), summary, a meta row (source, date with <time>, read time) and a share row (copy link, X, LinkedIn, WhatsApp).
- Full-width image with a caption and credit.
- Body text at a 680px reading width.
- A prominent primary button, "Read full story at {sourceName} ↗", opening in a new tab with rel="noopener noreferrer".
- Related stories grid.
- A thin 2px accent scroll-progress bar at the top.

OTHER PAGES

- /category/:slug: a large category title, a short description, a story grid, and a "Load more" button (client-side, 9 at a time).
- /archive: stories grouped by date (Today, Yesterday, then full dates) with sticky date headings. This is the daily-news history.
- /search: results for ?q=, with an empty state.
- /about: mission, what we cover, how we pick stories, and the editorial standards.
- /contact: a form (name, email, subject, message) plus a "Submit a story / tip" section. UI only with validation and a toast.
- /advertise: a simple partnership page (audience, formats, contact CTA).
- /privacy and /terms: clean readable legal-style pages with placeholder text.
- 404 page, in brand style.

STATES: skeleton loaders for every list and card (solid colour opacity pulse, NOT a shimmer gradient), friendly empty states and error states.

================================================== 5. MOTION (buttery smooth, subtle, premium)
==================================================

- Lenis smooth scroll: lerp 0.1, smoothWheel true, syncTouch false (keep native touch feel), driven by one requestAnimationFrame loop. On route change, scroll to top immediately. Add data-lenis-prevent to Sheets, Dialogs and any inner scroll areas. Disable Lenis entirely when prefers-reduced-motion is set.
- Scroll reveal: every section, card and heading fades and rises (opacity 0→1, y 24→0) with whileInView, once: true, viewport margin -80px, duration 0.7s, ease [0.22, 1, 0.36, 1]. Stagger grid children by 0.08s. Build one reusable <Reveal> wrapper and use it everywhere.
- Image reveal: images fade in with a slight scale 1.06→1 as they enter the viewport.
- Hero: a gentle sequential entrance on first load (headline, then meta, then image).
- Page transitions: a simple 250ms fade between routes.
- Animate ONLY transform and opacity (GPU-friendly). No layout-shifting animations. No parallax, no cursor effects, no gimmicks.
- Respect prefers-reduced-motion everywhere (fall back to instant, no motion).

================================================== 6. RESPONSIVE AND ALIGNMENT QUALITY BAR
==================================================

- Must look perfect at 320, 375, 414, 768, 1024, 1280, 1440 and 1920px. No horizontal scroll at any width.
- Grids: 1 col <640, 2 cols 640-1023, 3-4 cols ≥1024. Hero stacks below 1024.
- All content must be fully visible: never truncate headlines in hero or story pages, use line-clamp ONLY for card summaries, add min-w-0 to flex children, and use break-words on long titles. Nothing clipped, overlapped or cut off.
- Touch targets ≥44px. Consistent vertical rhythm. Baseline-aligned meta rows. Equal-height cards in each row.
- Images: always set aspect-ratio and width/height to avoid layout shift, with loading="lazy" below the fold and the hero image eager.

================================================== 7. ACCESSIBILITY AND SEO
==================================================

- Semantic HTML (header, nav, main, article, section, footer, time). Meaningful alt text. Visible 2px ink focus rings. WCAG AA contrast in both themes. Keyboard-navigable menus and overlays.
- Per-page <title> and meta description + Open Graph tags via react-helmet-async.

================================================== 8. DO NOT
==================================================

No gradients, no shadows, no glass or blur effects, no emojis in the UI, no stock "AI startup template" look, no extra features, pages or libraries beyond what's listed, no backend code. Keep the code clean, typed and modular. Build everything in one pass.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64622229-3e44-4cf7-8142-714e37edb7c4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
