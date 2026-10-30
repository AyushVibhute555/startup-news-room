import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/Logo";
import { btnPrimary } from "@/components/Buttons";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <LogoMark size={64} />
      <p className="font-label mt-8 text-sm text-signal">Error 404</p>
      <h1 className="headline mt-2 text-5xl">{t("errors.notFound")}</h1>
      <p className="mt-4 text-muted-foreground">{t("errors.notFoundBody")}</p>
      <Link to="/" className={btnPrimary("mt-8")}>
        {t("errors.backHome")}
      </Link>
    </div>
  );
}