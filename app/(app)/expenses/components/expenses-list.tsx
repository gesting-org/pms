"use client";

import { useState } from "react";
import Link from "next/link";
import { Expense, Property } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EXPENSE_CATEGORY_LABELS, formatARS, formatDate } from "@/lib/utils";
import { Plus, Search, Receipt, AlertCircle } from "lucide-react";

type ExpenseWithProp = Expense & { property: Property };

const STATUS_BADGE: Record<string, any> = {
  ADVANCED_BY_GESTING: "warning", REIMBURSED: "success", PAID_BY_OWNER: "secondary",
};
const STATUS_LABELS: Record<string, string> = {
  ADVANCED_BY_GESTING: "Adelantado Gesting", REIMBURSED: "Reintegrado", PAID_BY_OWNER: "Pagó propietario",
};
const CAT_ICONS: Record<string, string> = {
  CLEANING: "🧹", LAUNDRY: "👕", SUPPLIES: "📦", REPAIR: "🔧", UTILITY: "⚡", MAINTENANCE: "🏗️", OTHER: "📝",
};

export function ExpensesList({ expenses, properties, totalAdvanced }: {
  expenses: ExpenseWithProp[]; properties: Property[]; totalAdvanced: number;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propertyFilter, setPropertyFilter] = useState("ALL");

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || e.category === categoryFilter;
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchProp = propertyFilter === "ALL" || e.propertyId === propertyFilter;
    return matchSearch && matchCat && matchStatus && matchProp;
  });

  return (
    <div className="space-y-4">
      {totalAdvanced > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800 dark:text-amber-400">
            <strong>{formatARS(totalAdvanced)}</strong> adelantados por Gesting pendientes de reintegro.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <div className="relative min-w-[140px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Propiedad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Categorías</SelectItem>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ADVANCED_BY_GESTING">Adelantados</SelectItem>
              <SelectItem value="REIMBURSED">Reintegrados</SelectItem>
              <SelectItem value="PAID_BY_OWNER">Pagó propietario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/expenses/new"><Plus className="h-4 w-4" />Nuevo gasto</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin gastos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <span className="text-xl shrink-0">{CAT_ICONS[e.category] ?? "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.description}</p>
                <p className="text-xs text-muted-foreground">
                  {e.property.name} · {EXPENSE_CATEGORY_LABELS[e.category]} · {formatDate(e.date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatARS(e.amount)}</p>
                <Badge variant={STATUS_BADGE[e.status]} className="text-[10px]">
                  {STATUS_LABELS[e.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
