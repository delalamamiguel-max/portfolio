import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      className="ml-1 h-9 rounded-full border border-border bg-card/70 px-3 text-foreground backdrop-blur-sm hover:bg-card"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <span aria-hidden="true" className="mr-2 text-sm">
        {theme === "dark" ? "◐" : "◑"}
      </span>
      <span className="text-xs font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
    </Button>
  );
}

