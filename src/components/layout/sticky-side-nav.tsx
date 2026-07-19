import { cn } from "@/lib/utils";

type StickySideNavProps = {
  title: string;
  items: { id: string; label: string }[];
  className?: string;
};

export function StickySideNav({ title, items, className }: StickySideNavProps) {
  return (
    <aside className={cn("lg:sticky lg:top-8 lg:self-start", className)} aria-label={title}>
      <p className="mb-3 text-sm font-medium text-primary-text">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            {/* Buttons with scrollIntoView (not hash anchors) so section jumps
                work identically in the window and inside the overlay's scroll
                container, without polluting browser history. */}
            <button
              type="button"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="text-left text-sm text-muted-text transition-colors duration-200 hover:text-primary-text focus-visible:outline-none focus-visible:text-primary-text"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
