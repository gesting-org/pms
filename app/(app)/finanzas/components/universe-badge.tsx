"use client";

import { cn } from "@/lib/utils";

type Universe = "reservas" | "propietario" | "empresa";

const CONFIG: Record<Universe, { label: string; className: string }> = {
  reservas: {
    label: "Reservas",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  },
  propietario: {
    label: "Propietario",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  empresa: {
    label: "Empresa",
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
  },
};

interface UniverseBadgeProps {
  universe: Universe;
  className?: string;
}

export function UniverseBadge({ universe, className }: UniverseBadgeProps) {
  const { label, className: variantClass } = CONFIG[universe];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        variantClass,
        className
      )}
    >
      {label}
    </span>
  );
}
