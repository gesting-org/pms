"use client";

import { useState } from "react";
import Link from "next/link";
import { Liquidation, Property, Owner } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LIQUIDATION_STATUS_LABELS, formatARS, formatDate, cn } from "@/lib/utils";
import { Plus, DollarSign, AlertTriangle, ChevronRight, TrendingUp } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

type LiqWithRefs = Liquidation & { property: Property; owner: Owner };

const STATUS_BADGE: Record<string, any> = {
  PENDING: "warning", SENT: "info", PAID: "success", OVERDUE: "destructive",
};

function LiquidationRow({ l }: { l: LiqWithRefs }) {
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({ size: 320, opacity: 0.07 });
  return (
    <Link ref={ref} href={`/liquidations/${l.id}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-all overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div aria-hidden style={glowStyle} />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.property.colorTag }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{l.property.name}</p>
          <p className="text-xs text-muted-foreground">{l.owner.firstName} {l.owner.lastName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 text-sm">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Período</p>
          <p className="font-medium">{l.periodLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Bruto</p>
          <p className="font-medium">{formatARS(l.grossRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Neto propietario</p>
          <p className="font-bold text-emerald-600">{formatARS(l.netToOwner)}</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-xs text-muted-foreground">Vence</p>
          <p className="text-xs">{formatDate(l.dueDate)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={STATUS_BADGE[l.status]} className="text-[10px]">
          {LIQUIDATION_STATUS_LABELS[l.status]}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export function LiquidationsList({ liquidations, totalPending }: { liquidations: LiqWithRefs[]; totalPending: number }) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = liquidations.filter((l) => statusFilter === "ALL" || l.status === statusFilter);
  const overdueCount = liquidations.filter((l) => l.status === "OVERDUE").length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total pendiente", value: formatARS(totalPending), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "En mora", value: String(overdueCount), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Pagadas este mes", value: String(liquidations.filter((l) => l.status === "PAID").length), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Total mes", value: formatARS(liquidations.reduce((s, l) => s + l.grossRevenue, 0)), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${s.bg} shrink-0`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                <p className="text-sm font-bold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="SENT">Enviadas</SelectItem>
            <SelectItem value="PAID">Pagadas</SelectItem>
            <SelectItem value="OVERDUE">En mora</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild size="sm">
          <Link href="/liquidations/generate"><Plus className="h-4 w-4" />Generar liquidación</Link>
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((l) => (
          <LiquidationRow key={l.id} l={l} />
        ))}
      </div>
    </div>
  );
}
