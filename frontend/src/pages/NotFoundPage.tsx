import { Link } from "react-router-dom";
import { LogoMark } from "@/components/Logo";
import { btnPrimary } from "@/components/Buttons";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <LogoMark size={64} />
      <p className="font-label mt-8 text-sm text-signal">Error 404</p>
      <h1 className="headline mt-2 text-5xl">This story isn't on the wire.</h1>
      <p className="mt-4 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className={btnPrimary("mt-8")}>
        Back to headlines
      </Link>
    </div>
  );
}
