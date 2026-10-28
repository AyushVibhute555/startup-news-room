import * as Dialog from "@radix-ui/react-dialog";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Linkedin, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Container } from "@/components/Container";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { categories } from "@/data/categories";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const LINKEDIN_URL = "https://www.linkedin.com/company/startup-news-room/";

// ── Surface constants ──────────────────────────────────────────────
export const LOGO_COLOR = "#DFE1E0";
export const REST_COLOR = LOGO_COLOR;
export const INK = "#101312";
export const INK_MUTED = "#565C5A";

export const HEADER_VARS: CSSProperties = {
  backgroundColor: LOGO_COLOR,
  color: INK,
};

const NAV = [{ slug: "", name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))];

/* ── Utility Bar ─────────────────────────────────────────────────── */
function UtilityBar() {
  const [date, setDate] = useState("");
  useEffect(() => setDate(formatLongDate(new Date())), []);

  return (
    <div
      style={HEADER_VARS}
      className="border-b border-[rgba(16,19,18,0.08)] text-[0.8125rem] select-none"
    >
      <Container className="flex h-9 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="truncate text-[#565C5A]" suppressHydrationWarning>
            {date || "\u00a0"}
          </span>
          <span className="font-label flex shrink-0 items-center gap-1.5 text-xs text-[#101312]">
            <span className="live-dot h-2 w-2 rounded-full bg-signal" aria-hidden />
            Live
          </span>
        </div>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-[#565C5A] transition-colors duration-200 hover:text-signal min-[420px]:inline-flex"
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden /> LinkedIn
        </a>
      </Container>
    </div>
  );
}

function useActiveSlug() {
  const { pathname } = useLocation();
  if (pathname === "/") return "";
  const m = pathname.match(/^\/category\/([^/]+)/);
  return m ? m[1] : null;
}

function NavLink({
  slug,
  name,
  className,
  onClick,
}: {
  slug: string;
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  return slug ? (
    <Link to={`/category/${slug}`} className={className} onClick={onClick}>
      {name}
    </Link>
  ) : (
    <Link to="/" className={className} onClick={onClick}>
      {name}
    </Link>
  );
}

/* ── Sticky Header with Scroll Compaction ────────────────────────── */
export function Header() {
  const active = useActiveSlug();
  const reduce = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();

  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  // Reading progress line opacity (fades in after 8px scroll)
  const progressOpacity = useTransform(scrollY, [0, 8], [0, 1]);

  // Scroll compaction motion value p: 0 to 1 over first 140px
  const rawP = useTransform(scrollY, [0, 140], [0, 1], { clamp: true });
  const smoothP = useSpring(rawP, { stiffness: 220, damping: 30, mass: 0.5 });
  const p = reduce ? rawP : smoothP;

  // Unconditional transforms for smooth animation
  const animatedBarHeight = useTransform(p, [0, 1], [72, 64]);
  const animatedHairline = useTransform(
    p,
    [0, 1],
    ["rgba(16, 19, 18, 0.08)", "rgba(16, 19, 18, 0.14)"],
  );
  const animatedShadow = useTransform(p, [0, 1], [0, 1]);
  const animatedLogoScale = useTransform(p, [0, 1], [1, 0.92]);

  // Reduced motion fallbacks (snap values at 8px scroll, no compaction)
  const reducedHairline = useTransform(scrollY, (y) =>
    y > 8 ? "rgba(16, 19, 18, 0.14)" : "rgba(16, 19, 18, 0.08)",
  );
  const reducedShadow = useTransform(scrollY, (y) => (y > 8 ? 1 : 0));

  const barHeight = reduce ? 72 : animatedBarHeight;
  const hairlineAlpha = reduce ? reducedHairline : animatedHairline;
  const shadowOpacity = reduce ? reducedShadow : animatedShadow;
  const logoScale = reduce ? 1 : animatedLogoScale;

  // Hide on scroll down past 160px; reveal on upward scroll or focus-within
  useEffect(() => {
    if (reduce) return;
    return scrollY.on("change", (y) => {
      if (menuOpenRef.current) {
        setHidden(false);
        return;
      }
      const delta = y - lastY.current;
      if (Math.abs(delta) < 6) return;

      if (delta > 0 && y > 160) {
        setHidden(true);
      } else if (delta < 0) {
        setHidden(false);
      }
      lastY.current = y;
    });
  }, [scrollY, reduce]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] bg-[#101312] px-4 py-3 text-[#F2F4F3] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* 2px red reading-progress line fixed at top of viewport */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0 z-[45] h-[2px] bg-signal"
        style={{
          scaleX: scrollYProgress,
          transformOrigin: "left",
          opacity: progressOpacity,
        }}
      />

      <UtilityBar />

      <motion.header
        className="sticky top-0 z-40 h-[72px] pointer-events-none focus-within:!translate-y-0"
        animate={{ y: hidden && !menuOpen && !reduce ? -110 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onFocus={() => setHidden(false)}
      >
        <motion.div
          style={{
            ...HEADER_VARS,
            height: barHeight,
            borderBottomColor: hairlineAlpha,
          }}
          className="relative pointer-events-auto border-b"
        >
          <Container className="flex h-full items-center justify-between gap-4">
            {/* Logo with scale animation */}
            <Link
              to="/"
              aria-label="Startup News Room, home"
              className="flex min-w-0 items-center gap-3"
            >
              <motion.div
                style={{ scale: logoScale, transformOrigin: "left center" }}
                className="flex items-center gap-3"
              >
                <img
                  src="/startup_news_room_logo.jpg"
                  alt="Startup News Room Logo"
                  className="h-9 w-auto object-contain mix-blend-darken"
                />
                <span className="font-label hidden text-lg leading-none sm:inline xl:hidden 2xl:inline text-[#101312]">
                  Startup News Room
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Categories" className="hidden h-full lg:block">
              <ul className="flex h-full items-center gap-1">
                {NAV.map((n) => (
                  <li key={n.slug} className="relative h-full flex items-center">
                    <NavLink
                      slug={n.slug}
                      name={n.name}
                      className={cn(
                        "font-label flex h-full items-center px-3 text-[0.875rem] font-semibold transition-colors duration-300 ease-out",
                        active === n.slug ? "text-[#101312]" : "text-[#565C5A] hover:text-signal",
                      )}
                    />
                    {active === n.slug && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 bottom-0 h-0.5 bg-signal"
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Header Right Actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101312] transition-colors duration-200 hover:bg-black/5 hover:text-signal"
              >
                <Search className="h-4 w-4" />
              </button>

              <ThemeToggle className="hidden lg:inline-flex text-[#101312] hover:bg-black/5" />

              <a
                href="#newsletter"
                className="ml-2 hidden lg:inline-flex min-h-[38px] items-center justify-center rounded-[4px] bg-[#101312] px-4 text-xs font-semibold text-[#F2F4F3] transition-colors duration-200 hover:bg-signal hover:text-white"
              >
                Subscribe
              </a>

              {/* Mobile Drawer */}
              <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <Dialog.Trigger
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101312] transition-colors duration-200 hover:bg-black/5 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-[#101312]/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300" />
                  <Dialog.Content
                    data-lenis-prevent
                    style={HEADER_VARS}
                    className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-[rgba(16,19,18,0.12)] px-6 pb-8 pt-4 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300 text-[#101312]"
                  >
                    <div className="flex items-center justify-between">
                      <img
                        src="/startup_news_room_logo.jpg"
                        alt="Startup News Room Logo"
                        className="h-8 w-auto object-contain mix-blend-darken"
                      />
                      <Dialog.Close
                        aria-label="Close menu"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101312] transition-colors hover:bg-black/5"
                      >
                        <X className="h-5 w-5" />
                      </Dialog.Close>
                    </div>

                    <Dialog.Title className="sr-only">Menu</Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Browse categories and settings
                    </Dialog.Description>

                    <nav aria-label="Mobile categories" className="mt-6">
                      <ul className="divide-y divide-[rgba(16,19,18,0.1)] border-y border-[rgba(16,19,18,0.1)]">
                        {NAV.map((n) => (
                          <li key={n.slug}>
                            <NavLink
                              slug={n.slug}
                              name={n.name}
                              onClick={() => setMenuOpen(false)}
                              className={cn(
                                "font-label flex min-h-[52px] items-center text-2xl font-bold transition-colors duration-200 hover:text-signal",
                                active === n.slug ? "text-[#101312]" : "text-[#565C5A]",
                              )}
                            />
                          </li>
                        ))}
                      </ul>
                    </nav>

                    <div className="mt-auto flex flex-col gap-4 pt-8">
                      <ThemeToggle withLabel className="justify-start text-[#101312]" />
                      <a
                        href="#newsletter"
                        onClick={() => setMenuOpen(false)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] bg-[#101312] px-5 text-sm font-semibold text-[#F2F4F3] transition-colors duration-200 hover:bg-signal hover:text-white"
                      >
                        Subscribe
                      </a>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </Container>

          {/* 24px soft gradient shadow strip */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-full h-6"
            style={{
              background: "linear-gradient(to bottom, rgba(16, 19, 18, 0.10), transparent)",
              opacity: shadowOpacity,
            }}
          />
        </motion.div>
      </motion.header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
