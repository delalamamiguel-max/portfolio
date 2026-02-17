import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-base text-primary-text placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strategic-blue focus-visible:ring-offset-2 ring-offset-exec-navy disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
