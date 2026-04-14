"use client";

import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DriveSearchProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  isSearching?: boolean;
  disabled?: boolean;
}

export function DriveSearch({ value, onChange, onClear, isSearching, disabled }: DriveSearchProps) {
  return (
    <div className="relative flex-1 max-w-sm">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isSearching
          ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          : <Search className="h-4 w-4 text-muted-foreground" />
        }
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar archivos y carpetas..."
        className="pl-9 pr-8 h-9 text-sm bg-muted/30 border-border/60 focus:bg-background"
        disabled={disabled}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
