import { useEffect, useState } from "react";

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={[
        "fixed bottom-5 right-5 z-40",
        "rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-medium text-muted-text shadow-sm backdrop-blur",
        "transition-all duration-200 hover:text-foreground hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1",
      ].join(" ")}
    >
      Top
    </button>
  );
}
