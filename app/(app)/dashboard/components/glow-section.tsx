"use client";

import { GlowCard } from "@/components/ui/glow-card";
import { cn } from "@/lib/utils";

const CARD = "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]";

export function GlowSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GlowCard className={cn(CARD, "overflow-hidden", className)} opacity={0.07}>
      {children}
    </GlowCard>
  );
}
