import { cn } from "@/lib/utils";

type TagPillProps = {
  children: string;
  className?: string;
};

export function TagPill({ children, className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 break-words rounded-full border border-systems-teal/25 bg-systems-teal/10 px-3 py-1 font-mono text-xs tracking-normal text-accent shadow-sm backdrop-blur-md transition-colors duration-200 [overflow-wrap:anywhere]",
        className,
      )}
    >
      {children}
    </span>
  );
}
