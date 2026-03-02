import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  className?: string;
  density?: "default" | "dense";
  as?: "section" | "div";
  ariaLabel?: string;
  id?: string;
};

export function Section({ children, className, density = "default", as = "section", ariaLabel, id }: SectionProps) {
  const Component = as;

  return (
    <Component
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "container scroll-mt-24",
        density === "default" ? "py-8 md:py-10 lg:py-12" : "py-6 md:py-8 lg:py-10",
        className,
      )}
    >
      {children}
    </Component>
  );
}
