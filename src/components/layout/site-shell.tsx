import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import type { ReactNode } from "react";

const navItems = [
  { to: "/case-studies", label: "Case Studies" },
  { to: "/philosophy", label: "Philosophy" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-strategic-blue focus:px-4 focus:py-2 focus:text-primary-text"
      >
        Skip to main content
      </a>
      <header className="border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/"
            className="rounded-sm text-sm font-semibold uppercase tracking-[0.08em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Architected by Miguel
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 md:gap-2">
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
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
