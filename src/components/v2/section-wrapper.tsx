import type { ReactNode } from "react";

type SectionWrapperProps = {
  children: ReactNode;
  ariaLabel?: string;
};

export function SectionWrapper({ children, ariaLabel }: SectionWrapperProps) {
  return (
    <section className="v2-section" aria-label={ariaLabel}>
      <div className="v2-container">{children}</div>
    </section>
  );
}
