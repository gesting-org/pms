"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

type Universe = "reservas" | "propietario" | "empresa";

const UNIVERSE_STYLES: Record<Universe, { border: string; icon: string; glowColor: string }> = {
  reservas: {
    border: "border-t-blue-500",
    icon: "text-blue-500",
    glowColor: "37, 99, 235",
  },
  propietario: {
    border: "border-t-emerald-500",
    icon: "text-emerald-500",
    glowColor: "16, 185, 129",
  },
  empresa: {
    border: "border-t-violet-500",
    icon: "text-violet-500",
    glowColor: "139, 92, 246",
  },
};

interface FinancialKpiCardProps {
  label: string;
  value: string;
  sub?: string;
  universe: Universe;
  icon: React.ReactNode;
  trend?: number; // positive = up, negative = down, 0 = flat, undefined = no trend
  trendLabel?: string;
  className?: string;
}

export function FinancialKpiCard({
  label,
  value,
  sub,
  universe,
  icon,
  trend,
  trendLabel,
  className,
}: FinancialKpiCardProps) {
  const styles = UNIVERSE_STYLES[universe];
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({
    size: 240,
    opacity: 0.07,
    color: styles.glowColor,
  });

  const TrendIcon =
    trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend === undefined ? "" : trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-500" : "text-slate-400";

  return (
    <div
      ref={ref as any}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 border-t-4 p-5",
        "shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]",
        "hover:shadow-[0_4px_16px_rgba(16,24,40,0.09),0_2px_4px_rgba(16,24,40,0.05)] hover:-translate-y-0.5 transition-all duration-200",
        styles.border,
        className
      )}
    >
      <div aria-hidden style={glowStyle} />
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50", styles.icon)}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
      {(sub || (TrendIcon && trendLabel)) && (
        <div className="mt-2 flex items-center gap-1.5">
          {TrendIcon && (
            <TrendIcon className={cn("h-3.5 w-3.5 shrink-0", trendColor)} />
          )}
          <p className={cn("text-[11px] font-medium leading-tight", trendLabel && TrendIcon ? trendColor : "text-slate-400")}>
            {trendLabel ?? sub}
          </p>
        </div>
      )}
    </div>
  );
}
