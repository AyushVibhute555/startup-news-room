import { Link } from "react-router-dom";
import { Linkedin, Instagram, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";
import { LINKEDIN_URL, INSTAGRAM_URL, YOUTUBE_URL, HEADER_VARS } from "@/components/Header";
import { categories } from "@/data/categories";

// Updated link styles to be dark and readable on the light background
const linkCls =
  "inline-flex min-h-[32px] items-center text-sm text-[#565C5A] transition-colors hover:text-[#101312]";

export function Footer() {
  const { t } = useTranslation();

  return (
    // Applied the Header background color to the whole footer
    <footer
      style={HEADER_VARS}
      className="border-t border-[rgba(16,19,18,0.08)] overflow-hidden"
    >
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Link
              to="/"
              aria-label="Startup News Room, home"
              className="inline-flex"
            >
              <img
                src="/startup_news_room_logo.jpg"
                alt="Startup News Room Logo"
                className="h-14 w-auto object-contain mix-blend-darken"
              />
            </Link>

            <p className="mt-4 max-w-sm text-sm text-[#565C5A]">
              {t("footer.tagline")}
            </p>

            {/* Social Links - Bottom */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={`${linkCls} gap-2`}>
                <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${linkCls} gap-2`}>
                <Instagram className="h-4 w-4" aria-hidden /> Instagram
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={`${linkCls} gap-2`}>
                <Youtube className="h-4 w-4" aria-hidden /> YouTube
              </a>
            </div>
          </div>

          <nav aria-label={t("footer.categories")} className="lg:col-span-3">
            <h2 className="font-label text-sm font-bold text-[#101312]">{t("footer.categories")}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/category/${c.slug}`} className={linkCls}>
                    {t(`categories.${c.slug}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("footer.company")} className="lg:col-span-2">
            <h2 className="font-label text-sm font-bold text-[#101312]">{t("footer.company")}</h2>
            <ul className="mt-4">
              <li><Link to="/about" className={linkCls}>{t("nav.about")}</Link></li>
              <li><Link to="/archive" className={linkCls}>{t("nav.archive")}</Link></li>
              <li><Link to="/contact" className={linkCls}>{t("nav.contact")}</Link></li>
              <li><Link to="/advertise" className={linkCls}>{t("nav.advertise")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("footer.legal")} className="lg:col-span-2">
            <h2 className="font-label text-sm font-bold text-[#101312]">{t("footer.legal")}</h2>
            <ul className="mt-4">
              <li><Link to="/privacy" className={linkCls}>{t("footer.privacy")}</Link></li>
              <li><Link to="/terms" className={linkCls}>{t("footer.terms")}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-16 border-t border-[rgba(16,19,18,0.08)] pt-6 text-[0.8125rem] text-[#565C5A]">
          {t("footer.copyright")}
        </div>
      </Container>

      {/* 👇 The massive wordmark perfectly blends into the light background now 👇 */}
      <div className="w-full select-none pointer-events-none mt-4 overflow-hidden flex justify-center pb-4">
        <motion.svg
          viewBox="0 0 1600 200"
          className="w-full h-auto text-[#101312]/10"
          preserveAspectRatio="xMidYMid meet"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -50px 0px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="150"
            fontWeight="200"
            letterSpacing="0.01em"
            fill="currentColor"
            fontFamily="'Anton', Impact, sans-serif"
            textLength="1540"
            lengthAdjust="spacingAndGlyphs"
            style={{
              textTransform: "uppercase",
              WebkitTextStroke: "1.5px currentColor",
              paintOrder: "stroke fill",
            }}
          >
            Startup News Room
          </text>
        </motion.svg>
      </div>
    </footer>
  );
}