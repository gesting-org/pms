"use client";

import { useRef, useState, useCallback, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/* ── Hook ─────────────────────────────────────────────────────────────── */
interface GlowOptions {
  color?: string;   // RGB values as "r,g,b" e.g. "37,99,235"
  size?: number;    // px radius of the radial gradient
  opacity?: number; // 0–1
}

export function useGlow({ color = "37,99,235", size = 280, opacity = 0.10 }: GlowOptions = {}) {
  const ref = useRef<any>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const onMouseLeave = useCallback(() => setPos(null), []);

  const glowStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 10,
    transition: "opacity 300ms",
    opacity: pos ? 1 : 0,
    background: pos
      ? `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, rgba(${color},${opacity}), transparent 70%)`
      : "none",
  };

  return { ref, onMouseMove, onMouseLeave, glowStyle };
}

/* ── Wrapper component ────────────────────────────────────────────────── */
interface GlowCardProps extends GlowOptions {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function GlowCard({
  children,
  className,
  color,
  size,
  opacity,
  ...props
}: GlowCardProps) {
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({ color, size, opacity });

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      <div aria-hidden style={glowStyle} />
      {children}
    </div>
  );
}
