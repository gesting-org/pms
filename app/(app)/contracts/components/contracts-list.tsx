"use client";

import { useState } from "react";
import Link from "next/link";
import { ManagementContract, Property, Owner } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, FileText, AlertTriangle, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

type ContractWithRefs = ManagementContract & { property: Property; owner: Owner };

function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
}

type ContractStatus = ManagementContract["status"];

const STATUS_STYLE: Record<ContractStatus, { pill: string; label: string }> = {
  DRAFT:          { pill: "pill-draft",    label: "Borrador"    },
  ACTIVE:         { pill: "pill-active",   label: "Activo"      },
  EXPIRING_SOON:  { pill: "pill-warning",  label: "Por vencer"  },
  EXPIRED:        { pill: "pill-danger",   label: "Vencido"     },
  TERMINATED:     { pill: "pill-inactive", label: "Rescindido"  },
};

const STATUS_FILTERS = [
  { value: "TODOS",         label: "Todos"      },
  { value: "ACTIVE",        label: "Activos"    },
  { value: "EXPIRING_SOON", label: "Por vencer" },
  { value: "EXPIRED",       label: "Vencidos"   },
  { value: "DRAFT",         label: "Borrador"   },
];

function KpiStatCard({ label, value, sub, color, Icon }: { label: string; value: string; sub: string; color: string; Icon: React.ElementType }) {
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow({ size: 220, opacity: 0.08 });
  return (
    <div ref={ref} className="bg-white rounded-xl border border-border shadow-xs p-4 overflow-hidden relative" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <div aria-hidden style={glowStyle} />
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-lg font-bold tabular-nums", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

export function ContractsList({ contracts }: { contracts: ContractWithRefs[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("TODOS");

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.ownerFullName.toLowerCase().includes(q) ||
      (c.property?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "TODOS" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount    = contracts.filter((c) => c.status === "ACTIVE").length;
  const expiringCount  = contracts.filter((c) => c.status === "EXPIRING_SOON").length;
  const expiredCount   = contracts.filter((c) => c.status === "EXPIRED").length;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Contratos activos",  value: activeCount.toString(),   sub: "vigentes",         color: "text-emerald-600", Icon: CheckCircle  },
          { label: "Por vencer",         value: expiringCount.toString(), sub: "próximos 60 días", color: "text-amber-600",   Icon: Clock        },
          { label: "Vencidos",           value: expiredCount.toString(),  sub: "sin renovar",      color: "text-red-600",     Icon: AlertTriangle},
        ].map((props) => (
          <KpiStatCard key={props.label} {...props} />
        ))}
      </div>

      {/* Alert: por vencer */}
      {expiringCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{expiringCount} contrato{expiringCount > 1 ? "s" : ""}</span> por vencer próximamente. Revisá las renovaciones.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nro., propietario, propiedad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/contracts/new">
            <Plus className="h-4 w-4" />
            Nuevo contrato
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => {
          const count = value === "TODOS" ? contracts.length : contracts.filter((c) => c.status === value).length;
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {label}
              <span className={cn(
                "inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4",
                active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-20 mb-3" />
          <p className="text-sm font-medium">Sin resultados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[hsl(220_14%_98%)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Contrato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Propietario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Propiedad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Comisión</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Vence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const days = daysUntil(c.endDate);
                const nearExpiry = days > 0 && days <= 60;
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="contents group">
                    <tr className={cn(
                      "hover:bg-[hsl(220_14%_98%)] transition-colors cursor-pointer",
                      c.status === "EXPIRED" && "bg-red-50/30",
                      c.status === "EXPIRING_SOON" && "bg-amber-50/30",
                    )}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {c.contractNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(c.startDate)} · {c.durationMonths} meses
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-foreground">{c.ownerFullName}</p>
                        <p className="text-[10px] text-muted-foreground">DNI {c.ownerDni}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-4 rounded-sm shrink-0"
                            style={{ backgroundColor: c.property?.colorTag }}
                          />
                          <p className="text-xs text-foreground truncate max-w-[130px]">{c.property?.name ?? "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-xs font-semibold tabular-nums">{c.commissionRate}%</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className={cn("text-xs", nearExpiry ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                          {formatDate(c.endDate)}
                        </p>
                        {nearExpiry && (
                          <p className="text-[10px] text-amber-600">En {days} días</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("pill text-[11px]", STATUS_STYLE[c.status].pill)}>
                          {STATUS_STYLE[c.status].label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  </Link>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-2.5 border-t border-border bg-[hsl(220_14%_98%)]">
            <p className="text-xs text-muted-foreground">
              {filtered.length} de {contracts.length} contrato{contracts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
