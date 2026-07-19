import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

type CaseStudyOverlayProps = {
  /** True when the overlay was opened from within the app (history entry was pushed). */
  hasBackground: boolean;
  children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Immersive viewport for case studies and deep dives. Renders above the
 * homepage (which stays mounted with its scroll position intact), owns the
 * only scroll context while open, and unifies every close affordance
 * (button, Escape, backdrop, browser Back) through history so Back never
 * exits the portfolio unexpectedly.
 */
export function CaseStudyOverlay({ hasBackground, children }: CaseStudyOverlayProps) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (hasBackground) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  }, [hasBackground, navigate]);

  // Lock body scroll with the fixed-body technique (iOS-safe) and restore
  // the exact scroll position on close.
  useEffect(() => {
    const y = window.scrollY;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      window.scrollTo(0, y);
    };
  }, []);

  // Focus management: move focus into the dialog on open; return it to the
  // opening card (or the case-studies section heading) on unmount.
  useEffect(() => {
    const restoreSlug = slug;
    panelRef.current?.focus();

    return () => {
      // Deferred: at cleanup time the background tree is still inert (the
      // parent removes the attribute in its own effect, which runs after
      // child cleanup), and focus() into an inert subtree is a no-op.
      window.setTimeout(() => {
        const card = restoreSlug ? document.getElementById(`case-card-${restoreSlug}`) : null;
        const fallback = document.getElementById("case-studies-heading");
        (card ?? fallback)?.focus();
      }, 0);
    };
  }, [slug]);

  // Escape closes; Tab cycles within the dialog (fallback alongside inert).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (element) => element.offsetParent !== null,
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div
      className="cs-overlay-backdrop fixed inset-0 z-[60] flex items-stretch justify-center bg-slate-950/60 backdrop-blur-sm md:items-center md:p-[3vh_3vw]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-study-title"
        tabIndex={-1}
        className="cs-overlay-panel relative h-dvh w-full overflow-y-auto overscroll-contain bg-background shadow-2xl outline-none md:h-[94dvh] md:w-[min(1200px,94vw)] md:rounded-2xl md:border md:border-[color:var(--glass-border)]"
      >
        <div className="pointer-events-none sticky top-0 z-10 flex justify-end p-3">
          <button
            type="button"
            onClick={close}
            aria-label="Close case study"
            className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--glass-border)] bg-[var(--glass-surface-strong)] px-4 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:bg-[var(--glass-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-systems-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Close
            <span aria-hidden>✕</span>
          </button>
        </div>
        <div className="-mt-10">{children}</div>
      </div>
    </div>
  );
}
