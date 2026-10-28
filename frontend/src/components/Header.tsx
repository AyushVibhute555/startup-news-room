import * as Dialog from "@radix-ui/react-dialog";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Linkedin, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { btnPrimary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { categories } from "@/data/categories";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const LINKEDIN_URL = "https://www.linkedin.com/company/startup-news-room/";

const NAV = [{ slug: "", name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))];

function UtilityBar() {
  const [date, setDate] = useState("");
  useEffect(() => setDate(formatLongDate(new Date())), []);

  return (
    <div className="bg-[#D9D9D9] border-b border-black/5 text-[0.8125rem] transition-colors duration-300">
      <Container className="flex h-9 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="truncate text-black/70" suppressHydrationWarning>
            {date || "\u00a0"}
          </span>
          <span className="font-label flex shrink-0 items-center gap-1.5 text-xs text-black/80">
            <span
              className="live-dot h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              aria-hidden
            />
            Live
          </span>
        </div>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-black/70 transition-colors hover:text-black min-[420px]:inline-flex"
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

export function Header() {
  const active = useActiveSlug();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      // Update scrolled state for the background transition
      setScrolled(y > 20);

      // Hide/Show header logic on scroll down/up
      if (y > lastY.current && y > 160) setHidden(true);
      else if (y < lastY.current) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] bg-black px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <UtilityBar />
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hidden && !menuOpen ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
          // Locked to #D9D9D9 regardless of color scheme
          scrolled
            ? "bg-[#D9D9D9]/80 backdrop-blur-xl border-b border-black/10 shadow-sm"
            : "bg-[#D9D9D9] border-b border-transparent",
        )}
      >
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Startup News Room, home"
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src="/startup_news_room_logo.jpg"
              alt="Startup News Room Logo"
              // Using mix-blend-darken drops the grey background and only keeps the black text
              className="h-10 w-auto object-contain mix-blend-darken"
            />
            <span className="font-label hidden text-lg leading-none sm:inline xl:hidden 2xl:inline text-black">
              Startup News Room
            </span>
          </Link>

          <nav aria-label="Categories" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.slug} className="relative">
                  <NavLink
                    slug={n.slug}
                    name={n.name}
                    className={cn(
                      "font-label flex h-11 items-center px-3 text-[0.9375rem] transition-colors duration-300 ease-out hover:text-black",
                      active === n.slug ? "text-black font-medium" : "text-black/60",
                    )}
                  />
                  {active === n.slug && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-[15px] h-[3px] rounded-t-full bg-black"
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black/80 transition-all duration-300 hover:bg-black/5 hover:text-black"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle className="hidden lg:inline-flex" />
            <a href="#newsletter" className={btnPrimary("ml-2 hidden lg:inline-flex")}>
              Subscribe
            </a>

            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger
                aria-label="Open menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black/80 transition-colors hover:bg-black/5 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                  data-lenis-prevent
                  className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-black/10 bg-[#D9D9D9] px-6 pb-8 pt-4 shadow-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
                >
                  <div className="flex items-center justify-between">
                    <img
                      src="/startup_news_room_logo.jpg"
                      alt="Startup News Room Logo"
                      // Consistent fix applied to the mobile menu logo
                      className="h-8 w-auto object-contain mix-blend-darken"
                    />
                    <Dialog.Close
                      aria-label="Close menu"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-black/80 transition-colors hover:bg-black/5"
                    >
                      <X className="h-6 w-6" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Browse categories and settings
                  </Dialog.Description>
                  <nav aria-label="Mobile categories" className="mt-6">
                    <ul className="divide-y divide-black/10 border-y border-black/10">
                      {NAV.map((n) => (
                        <li key={n.slug}>
                          <NavLink
                            slug={n.slug}
                            name={n.name}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              "font-label flex min-h-[56px] items-center text-3xl transition-colors duration-300 hover:text-black",
                              active === n.slug ? "text-black font-medium" : "text-black/70",
                            )}
                          />
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="mt-auto flex flex-col gap-4 pt-8">
                    <ThemeToggle withLabel className="justify-start text-black" />
                    <a
                      href="#newsletter"
                      onClick={() => setMenuOpen(false)}
                      className={btnPrimary("w-full")}
                    >
                      Subscribe
                    </a>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </Container>
      </header>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
