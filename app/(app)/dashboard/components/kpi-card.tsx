"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGlow } from "@/components/ui/glow-card";

const CARD = "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]";
const CARD_HOVER = "hover:shadow-[0_4px_16px_rgba(16,24,40,0.09),0_2px_4px_rgba(16,24,40,0.05)] hover:-translate-y-0.5 transition-all duration-200";

interface KpiCardProps {
  href: string;
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  accent: { label: string; color: string } | null;
}

export function KpiCard({ href, label, value, sub, icon, iconBg, accent }: KpiCardProps) {
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({ size: 260 });

  return (
    <Link
      ref={ref}
      href={href}
      className={cn(CARD, CARD_HOVER, "p-5 sm:p-6 flex flex-row sm:flex-col gap-4 group overflow-hidden relative")}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div aria-hidden style={glowStyle} />
      <div className="flex items-center justify-between w-full sm:block">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", iconBg)}>
          {icon}
        </div>
        {accent && (
          <span className={cn("text-[12px] font-bold px-2.5 py-1 rounded-full sm:hidden", accent.color)}>
            {accent.label}
          </span>
        )}
      </div>
      <div className="flex-1 sm:mt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 leading-none uppercase tracking-wide">{label}</p>
          {accent && (
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-flex", accent.color)}>
              {accent.label}
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 tabular-nums animate-count-up">{value}</p>
        <p className="text-xs text-slate-400 mt-1.5 leading-tight">{sub}</p>
      </div>
    </Link>
  );
}
