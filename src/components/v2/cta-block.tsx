import { Link } from "react-router-dom";

type CTABlockProps = {
  title: string;
  text: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
};

export function CTABlock({ title, text, primary, secondary }: CTABlockProps) {
  return (
    <section className="v2-cta v2-stack-16" aria-label="Call to action">
      <h3 className="v2-h3">{title}</h3>
      <p className="v2-body v2-text-column">{text}</p>
      <div className="v2-inline-actions">
        <Link className="v2-btn" to={primary.to}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link className="v2-btn" to={secondary.to}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
