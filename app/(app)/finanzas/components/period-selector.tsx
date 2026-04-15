"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  { value: "0", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

interface PeriodSelectorProps {
  year: number;
  month: number; // 0 = all months
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  loading?: boolean;
}

export function PeriodSelector({ year, month, onYearChange, onMonthChange, loading }: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  return (
    <div className={`flex items-center gap-2 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
      <Select value={String(year)} onValueChange={(v) => onYearChange(parseInt(v))}>
        <SelectTrigger className="h-8 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-xs">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(month)} onValueChange={(v) => onMonthChange(parseInt(v))}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
