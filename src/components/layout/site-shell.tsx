import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useEffect, useState, type ReactNode } from "react";
import { getHomepageStructure } from "@/lib/content-loader";

const NAV_BLOCK_TYPES = new Set(["case-studies", "philosophy", "resume", "contact"]);
const navItems = getHomepageStructure()
  .filter((block) => block.enabled && NAV_BLOCK_TYPES.has(block.type))
  .map((block) => ({ hash: `#${block.id}`, sectionId: block.id, label: block.navLabel }));

export function SiteShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSectionId("");
      return;
    }

    if (location.hash.startsWith("#")) {
      setActiveSectionId(location.hash.slice(1));
    }

    const sections = navItems
      .map((item) => document.getElementById(item.sectionId))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) {
          return;
        }

        const topId = visible[0].target.id;
        setActiveSectionId((previous) => {
          if (previous === topId) return previous;
          window.history.replaceState(null, "", `/#${topId}`);
          return topId;
        });
      },
      { rootMargin: "-92px 0px -45% 0px", threshold: [0.25, 0.5, 0.75] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-strategic-blue focus:px-4 focus:py-2 focus:text-primary-text"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link
            to="/"
            className="min-w-0 rounded-sm text-xs font-semibold uppercase tracking-[0.08em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
          >
            Architected by Miguel
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex md:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.hash}
                to={`/${item.hash}`}
                className={`rounded-md px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  location.pathname === "/" && activeSectionId === item.sectionId
                    ? "text-foreground"
                    : "text-muted-text hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
            {location.pathname.startsWith("/admin") || location.pathname.startsWith("/deep-dive") || location.pathname === "/style-guide" ? (
              <Button variant="ghost" className="ml-2" onClick={onLogout}>
                Logout
              </Button>
            ) : null}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle className="px-2.5" />
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md border border-border bg-card/70 px-3 text-xs font-medium text-foreground hover:bg-card"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-primary-nav"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? "Close" : "Menu"}
            </Button>
          </div>
        </div>
        <div
          id="mobile-primary-nav"
          className={`${mobileNavOpen ? "block" : "hidden"} border-t border-border/70 md:hidden`}
        >
          <nav aria-label="Mobile primary" className="container py-3">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={`mobile-${item.hash}`}
                  to={`/${item.hash}`}
                  className={`w-full rounded-md px-3 py-2 text-left text-base leading-6 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    location.pathname === "/" && activeSectionId === item.sectionId
                      ? "bg-secondary text-foreground"
                      : "text-muted-text hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {location.pathname.startsWith("/admin") || location.pathname.startsWith("/deep-dive") || location.pathname === "/style-guide" ? (
                <Button variant="ghost" className="mt-1 h-10 justify-start px-3 text-base" onClick={onLogout}>
                  Logout
                </Button>
              ) : null}
            </div>
          </nav>
        </div>
      </header>
      <main id="main-content">{children ?? <Outlet />}</main>
    </div>
  );
}
