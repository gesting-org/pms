import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none transition-colors border",
  {
    variants: {
      variant: {
        default:     "bg-primary text-white border-primary",
        secondary:   "bg-muted text-muted-foreground border-border",
        destructive: "bg-red-50 text-red-600 border-red-200",
        outline:     "bg-transparent text-foreground border-border",
        success:     "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning:     "bg-amber-50 text-amber-700 border-amber-200",
        info:        "bg-blue-50 text-blue-700 border-blue-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
