import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface RailSectionProps {
  number: string;
  name: string;
  description?: string;
  linkLabel?: string;
  linkTo?: string;
  id: string;
  children: ReactNode;
}

export function RailSection({
  number,
  name,
  description,
  linkLabel,
  linkTo,
  id,
  children,
}: RailSectionProps) {
  return (
    <section className="rail-section" aria-labelledby={id}>
      <div className="rail-section__rail">
        <div className="rail-section__rail-left">
          <span className="rail-section__number" aria-hidden>
            {number}
          </span>
          <h2 className="rail-section__name" id={id}>
            {name}
          </h2>
        </div>
        {description && <p className="rail-section__desc">{description}</p>}
        {linkLabel && linkTo && (
          <Link to={linkTo} className="rail-section__link">
            {linkLabel} <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      <div className="rail-section__content">{children}</div>
    </section>
  );
}
