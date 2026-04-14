"use client";

import { useState } from "react";
import Link from "next/link";
type Tenant = any; type Contract = any;
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, Users, ChevronRight, Star } from "lucide-react";

type TenantWithContracts = Tenant & { contracts: Contract[] };

const SCORE_STYLE: Record<Tenant["score"], { pill: string; label: string }> = {
  EXCELENTE: { pill: "pill-active",  label: "Excelente" },
  BUENO:     { pill: "pill-info",    label: "Bueno"     },
  REGULAR:   { pill: "pill-warning", label: "Regular"   },
  MALO:      { pill: "pill-danger",  label: "Malo"      },
};

export function TenantsList({ tenants }: { tenants: TenantWithContracts[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      t.dni.includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.occupation ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "TODOS" ||
      (filter === "ACTIVOS" && t.isActive) ||
      (filter === "INACTIVOS" && !t.isActive);
    return matchSearch && matchFilter;
  });

  const activeCount   = tenants.filter((t) => t.isActive).length;
  const inactiveCount = tenants.filter((t) => !t.isActive).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, DNI, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/tenants/new">
            <Plus className="h-4 w-4" />
            Nuevo inquilino
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {([
          { value: "TODOS",    label: "Todos",    count: tenants.length },
          { value: "ACTIVOS",  label: "Activos",  count: activeCount    },
          { value: "INACTIVOS",label: "Inactivos",count: inactiveCount  },
        ] as const).map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === value
                ? "bg-primary text-white shadow-xs"
                : "bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            {label}
            <span className={cn(
              "inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4",
              filter === value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-10 w-10 opacity-20 mb-3" />
          <p className="text-sm font-medium">Sin resultados</p>
          <p className="text-xs mt-1">
            {search || filter !== "TODOS" ? "Probá con otros filtros" : "Registrá el primer inquilino"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[hsl(220_14%_98%)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Inquilino</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden sm:table-cell">DNI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden md:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden lg:table-cell">Ocupación</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide hidden xl:table-cell">Contratos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Score</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const score = SCORE_STYLE[t.score];
                const activeContract = t.contracts.find((c: any) => c.status === "ACTIVO");
                return (
                  <Link key={t.id} href={`/tenants/${t.id}`} className="contents group">
                    <tr className="hover:bg-[hsl(220_14%_98%)] transition-colors cursor-pointer">
                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            t.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {t.firstName[0]}{t.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                              {t.firstName} {t.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* DNI */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-foreground tabular-nums">{t.dni}</span>
                      </td>
                      {/* Teléfono */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-foreground">{t.phone}</span>
                      </td>
                      {/* Ocupación */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div>
                          <p className="text-xs text-foreground">{t.occupation ?? "—"}</p>
                          {t.employer && (
                            <p className="text-[10px] text-muted-foreground">{t.employer}</p>
                          )}
                        </div>
                      </td>
                      {/* Contratos */}
                      <td className="px-4 py-3 text-center hidden xl:table-cell">
                        <span className={cn(
                          "text-xs font-semibold",
                          activeContract ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {t.contracts.length}
                          {activeContract && <span className="text-[10px] ml-1 font-normal">(activo)</span>}
                        </span>
                      </td>
                      {/* Score */}
                      <td className="px-4 py-3">
                        <span className={cn("pill text-[11px]", score.pill)}>
                          <Star className="h-2.5 w-2.5" />
                          {score.label}
                        </span>
                      </td>
                      {/* Chevron */}
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
              {filtered.length} de {tenants.length} inquilino{tenants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
