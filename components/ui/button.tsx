import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 whitespace-nowrap active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-white hover:bg-blue-600 active:bg-blue-700 shadow-xs hover:shadow-[0_0_16px_rgba(37,99,235,0.35)] rounded-lg",
        destructive: "bg-red-500 text-white hover:bg-red-600 hover:shadow-[0_0_14px_rgba(239,68,68,0.3)] rounded-lg shadow-xs",
        outline:     "border border-border bg-white text-foreground hover:bg-muted hover:border-primary/30 rounded-lg shadow-xs",
        secondary:   "bg-muted text-foreground hover:bg-border rounded-lg",
        ghost:       "text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg",
        link:        "text-primary underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        default: "h-8 px-3.5 text-sm",
        sm:      "h-7 px-2.5 text-xs",
        lg:      "h-10 px-5 text-sm",
        xl:      "h-11 px-6 text-base",
        icon:    "h-8 w-8 [&_svg]:size-4",
        "icon-sm":"h-7 w-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
