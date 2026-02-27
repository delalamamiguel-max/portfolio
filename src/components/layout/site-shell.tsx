import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { to: "/case-studies", label: "Case Studies" },
  { to: "/philosophy", label: "Philosophy" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
      <header className="border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link
            to="/"
            className="min-w-0 rounded-sm text-xs font-semibold uppercase tracking-[0.08em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
          >
            Architected by Miguel
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex md:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive ? "text-foreground" : "text-muted-text hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle />
            {location.pathname.startsWith("/case-studies") || location.pathname.startsWith("/deep-dive") ? (
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
                <NavLink
                  key={`mobile-${item.to}`}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full rounded-md px-3 py-2 text-left text-base leading-6 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive ? "bg-secondary text-foreground" : "text-muted-text hover:bg-secondary hover:text-foreground"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {location.pathname.startsWith("/case-studies") || location.pathname.startsWith("/deep-dive") ? (
                <Button variant="ghost" className="mt-1 h-10 justify-start px-3 text-base" onClick={onLogout}>
                  Logout
                </Button>
              ) : null}
            </div>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
