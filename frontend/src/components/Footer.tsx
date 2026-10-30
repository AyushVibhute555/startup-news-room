import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/Container";
import { LINKEDIN_URL } from "@/components/Header";
import { categories } from "@/data/categories";

const linkCls =
  "inline-flex min-h-[32px] items-center text-sm text-inverse-muted transition-colors hover:text-inverse-foreground";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-inverse-border bg-inverse text-inverse-foreground">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Link
              to="/"
              aria-label="Startup News Room, home"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/startup_news_room_logo.jpg"
                alt="Startup News Room Logo"
                className="h-14 w-14 rounded-full object-cover border border-inverse-border/50"
              />
              <span className="font-label text-xl">Startup News Room</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-inverse-muted">
              {t("footer.tagline")}
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkCls} mt-4 gap-2`}
            >
              <Linkedin className="h-4 w-4" aria-hidden /> {t("footer.followLinkedIn")}
            </a>
          </div>
          <nav aria-label={t("footer.categories")} className="lg:col-span-3">
            <h2 className="font-label text-sm">{t("footer.categories")}</h2>
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
            <h2 className="font-label text-sm">{t("footer.company")}</h2>
            <ul className="mt-4">
              <li>
                <Link to="/about" className={linkCls}>
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link to="/archive" className={linkCls}>
                  {t("nav.archive")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkCls}>
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link to="/advertise" className={linkCls}>
                  {t("nav.advertise")}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={t("footer.legal")} className="lg:col-span-2">
            <h2 className="font-label text-sm">{t("footer.legal")}</h2>
            <ul className="mt-4">
              <li>
                <Link to="/privacy" className={linkCls}>
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkCls}>
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-16 border-t border-inverse-border pt-6 text-[0.8125rem] text-inverse-muted">
          {t("footer.copyright")}
        </div>
      </Container>
      <Container>
        <div className="footer-wordmark" aria-hidden>
          Startup News Room
        </div>
      </Container>
    </footer>
  );
}