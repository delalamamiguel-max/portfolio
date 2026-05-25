import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-[color:var(--glass-border)] bg-[var(--glass-surface)] px-3 py-2 text-base text-foreground shadow-inner shadow-slate-950/10 backdrop-blur-xl placeholder:text-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-systems-teal focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
