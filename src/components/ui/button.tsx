import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium shadow-[0_12px_35px_rgba(3,7,18,0.18)] backdrop-blur-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-systems-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default: "border border-systems-teal/35 bg-systems-teal/20 text-foreground hover:border-systems-teal/70 hover:bg-systems-teal/30 active:bg-systems-teal/25",
        primary: "border border-systems-teal/35 bg-systems-teal/20 text-foreground hover:border-systems-teal/70 hover:bg-systems-teal/30 active:bg-systems-teal/25",
        secondary: "border border-[color:var(--glass-border)] bg-[var(--glass-surface)] text-foreground hover:border-[color:var(--glass-border)] hover:bg-[var(--glass-surface-strong)]",
        subtle: "border border-transparent bg-transparent text-muted-text shadow-none hover:border-[color:var(--glass-border-soft)] hover:bg-[var(--glass-surface)] hover:text-foreground",
        ghost: "border border-transparent bg-transparent text-muted-text shadow-none hover:border-[color:var(--glass-border-soft)] hover:bg-[var(--glass-surface)] hover:text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
