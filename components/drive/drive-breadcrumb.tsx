"use client";

import { ChevronRight, Home } from "lucide-react";
import type { DriveBreadcrumb } from "@/types/drive";
import { cn } from "@/lib/utils";

interface DriveBreadcrumbBarProps {
  breadcrumb: DriveBreadcrumb[];
  onNavigate: (crumb: DriveBreadcrumb, index: number) => void;
  disabled?: boolean;
}

export function DriveBreadcrumbBar({ breadcrumb, onNavigate, disabled }: DriveBreadcrumbBarProps) {
  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0">
      {breadcrumb.map((crumb, idx) => {
        const isLast = idx === breadcrumb.length - 1;
        const isFirst = idx === 0;
        return (
          <div key={crumb.id} className="flex items-center gap-0.5 shrink-0">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
            <button
              onClick={() => !disabled && !isLast && onNavigate(crumb, idx)}
              disabled={disabled || isLast}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors max-w-[160px]",
                isLast
                  ? "font-semibold text-foreground cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer",
                disabled && "opacity-50 pointer-events-none",
              )}
            >
              {isFirst && <Home className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{isFirst ? "Inicio" : crumb.name}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
