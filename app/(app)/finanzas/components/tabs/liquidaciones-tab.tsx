"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS, formatARSShort, formatDate, LIQUIDATION_STATUS_LABELS } from "@/lib/utils";
import { ChevronRight, DollarSign, AlertTriangle, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";
import type { LiquidationStatusSummary } from "@/lib/db/finanzas-queries";

type LiqWithRefs = {
  id: string;
  periodLabel: string;
  grossRevenue: number;
  operationalExpenses: number;
  commissionAmount: number;
  commissionRate: number;
  netToOwner: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  property?: { name: string; colorTag: string };
  owner?: { firstName: string; lastName: string };
};

const STATUS_BADGE: Record<string, any> = {
  PENDING: "warning",
  SENT: "info",
  PAID: "success",
  OVERDUE: "destructive",
};

function LiquidationRow({ l }: { l: LiqWithRefs }) {
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({ size: 320, opacity: 0.07 });

  return (
    <Link
      ref={ref as any}
      href={`/liquidations/${l.id}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-all overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div aria-hidden style={glowStyle} />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: l.property?.colorTag ?? "#3b82f6" }}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{l.property?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-5 text-sm flex-wrap">
        <div className="text-center min-w-[60px]">
          <p className="text-[10px] text-muted-foreground">Período</p>
          <p className="font-medium text-xs">{l.periodLabel}</p>
        </div>
        {/* Mini waterfall */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
            {formatARSShort(l.grossRevenue)}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            − {formatARSShort(l.operationalExpenses)}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
            − {formatARSShort(l.commissionAmount)} ({l.commissionRate}%)
          </span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
            {formatARSShort(l.netToOwner)}
          </span>
        </div>
        <div className="text-center min-w-[80px] sm:block">
          <p className="text-[10px] text-muted-foreground">Neto propietario</p>
          <p className="font-bold text-emerald-600 tabular-nums">{formatARS(l.netToOwner)}</p>
        </div>
        <div className="text-center min-w-[70px] hidden sm:block">
          <p className="text-[10px] text-muted-foreground">Vence</p>
          <p className="text-xs">{formatDate(l.dueDate)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={STATUS_BADGE[l.status]} className="text-[10px]">
          {LIQUIDATION_STATUS_LABELS[l.status] ?? l.status}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

interface LiquidacionesTabProps {
  liquidations: LiqWithRefs[];
  summary: LiquidationStatusSummary[];
}

const STATUS_FILTERS = ["ALL", "PENDING", "SENT", "PAID", "OVERDUE"];
const STATUS_LABELS_FILTER: Record<string, string> = {
  ALL: "Todas", PENDING: "Pendientes", SENT: "Enviadas", PAID: "Pagadas", OVERDUE: "En mora",
};

export function LiquidacionesTab({ liquidations, summary }: LiquidacionesTabProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = liquidations.filter((l) => statusFilter === "ALL" || l.status === statusFilter);

  const totalPendiente = liquidations
    .filter((l) => l.status === "PENDING" || l.status === "SENT" || l.status === "OVERDUE")
    .reduce((s, l) => s + l.netToOwner, 0);

  const totalPagado = liquidations
    .filter((l) => l.status === "PAID")
    .reduce((s, l) => s + l.netToOwner, 0);

  const overdueCount = liquidations.filter((l) => l.status === "OVERDUE").length;

  const countByStatus = Object.fromEntries(
    summary.map((s) => [s.status, s.count])
  );

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 shrink-0">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">Pendiente propietarios</p>
              <p className="text-sm font-bold truncate tabular-nums">{formatARSShort(totalPendiente)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">Total pagado</p>
              <p className="text-sm font-bold truncate tabular-nums">{formatARSShort(totalPagado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">En mora</p>
              <p className="text-sm font-bold truncate">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {STATUS_LABELS_FILTER[s]}
            {s !== "ALL" && countByStatus[s] !== undefined && (
              <span className="ml-1 opacity-70">({countByStatus[s]})</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <Link href="/liquidations">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Gestión completa
          </Button>
        </Link>
      </div>

      {/* Liquidation rows */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium text-sm">Sin liquidaciones en este filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <LiquidationRow key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}
