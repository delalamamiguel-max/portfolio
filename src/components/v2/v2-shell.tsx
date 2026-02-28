import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/components/theme/theme-provider";

const navItems = [
  { to: "/v2", label: "Home" },
  { to: "/v2/case-studies", label: "Case Studies" },
  { to: "/v2/philosophy", label: "Philosophy" },
  { to: "/v2/resume", label: "Resume" },
  { to: "/v2/contact", label: "Contact" },
];

export function V2Shell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="v2-root">
      <header className="v2-header">
        <div className="v2-container v2-header-inner">
          <Link className="v2-brand" to="/v2">
            Architected by Miguel
          </Link>

          <div className="v2-nav-group">
            <nav aria-label="Primary">
              <ul className="v2-nav-list">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.to === "/v2"}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <button type="button" className="v2-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? "Dark" : "Light"}
            </button>
            <button
              type="button"
              className="v2-menu-btn"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="v2-mobile-nav"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        <div id="v2-mobile-nav" className={`v2-mobile-nav ${open ? "is-open" : ""}`}>
          <div className="v2-container">
            <nav aria-label="Mobile primary">
              {navItems.map((item) => (
                <NavLink key={`m-${item.to}`} to={item.to} end={item.to === "/v2"}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
