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
        density === "default" ? "py-12 md:py-16 lg:py-24" : "py-12 md:py-14 lg:py-20",
        className,
      )}
    >
      {children}
    </Component>
  );
}
