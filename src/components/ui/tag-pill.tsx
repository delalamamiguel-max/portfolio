import { cn } from "@/lib/utils";

type TagPillProps = {
  children: string;
  className?: string;
};

export function TagPill({ children, className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 break-words rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs tracking-wide text-systems-teal [overflow-wrap:anywhere]",
        className,
      )}
    >
      {children}
    </span>
  );
}
