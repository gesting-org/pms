"use client";

import { useState } from "react";
import { formatARS, formatARSShort, COMPANY_EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UniverseBadge } from "../universe-badge";
import { CompanyExpenseForm } from "../company-expense-form";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Trash2, AlertCircle, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SerializedCompanyExpense } from "@/lib/db/finanzas-serialize";
import Link from "next/link";

interface GastosTabProps {
  companyExpenses: SerializedCompanyExpense[];
  propertyExpenses: any[];
  companyRevenue: number;
  netProfit: number;
}

const CAT_COLORS: Record<string, string> = {
  MARKETING: "#3b82f6",
  SOFTWARE: "#8b5cf6",
  SALARY: "#f59e0b",
  SUBSCRIPTION: "#06b6d4",
  TOOLS: "#10b981",
  HONORARIOS: "#ec4899",
  OFFICE: "#6366f1",
  OTHER: "#94a3b8",
};

const PROP_EXP_ICONS: Record<string, string> = {
  CLEANING: "🧹", LAUNDRY: "👕", SUPPLIES: "📦",
  REPAIR: "🔧", UTILITY: "⚡", MAINTENANCE: "🏗️", OTHER: "📝",
};

export function GastosTab({ companyExpenses: initialExpenses, propertyExpenses, companyRevenue, netProfit }: GastosTabProps) {
  const [activeView, setActiveView] = useState<"empresa" | "propiedad">("empresa");
  const [expenses, setExpenses] = useState<SerializedCompanyExpense[]>(initialExpenses);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SerializedCompanyExpense | null>(null);

  const companyTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const propertyTotal = propertyExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  // Build pie data for company expenses by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  });
  const pieData = Object.entries(categoryTotals).map(([k, v]) => ({
    name: COMPANY_EXPENSE_CATEGORY_LABELS[k] ?? k,
    value: v,
    color: CAT_COLORS[k] ?? "#94a3b8",
  }));

  function handleSaved(expense: SerializedCompanyExpense) {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = expense;
        return updated;
      }
      return [expense, ...prev];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    const res = await fetch(`/api/finanzas/company-expenses/${id}`, { method: "DELETE" });
    if (res.ok) setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === "empresa" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("empresa")}
          className="gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Gastos empresa
          <Badge variant="secondary" className="ml-1 text-[10px]">{expenses.length}</Badge>
        </Button>
        <Button
          variant={activeView === "propiedad" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("propiedad")}
          className="gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Gastos propiedades
          <Badge variant="secondary" className="ml-1 text-[10px]">{propertyExpenses.length}</Badge>
        </Button>
      </div>

      {/* ── EMPRESA VIEW ─────────────────────────────────────────────────────── */}
      {activeView === "empresa" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UniverseBadge universe="empresa" />
                <p className="text-xs font-semibold text-violet-800">Gastos de Gesting — SÍ impactan en la utilidad</p>
              </div>
              <p className="text-[11px] text-violet-600">
                Marketing, software, sueldos, honorarios, suscripciones, herramientas y estructura operativa.
              </p>
            </div>
          </div>

          {/* Utilidad row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-center">
              <p className="text-[10px] text-violet-500 uppercase tracking-wide font-semibold">Revenue empresa</p>
              <p className="text-xl font-bold text-violet-800 tabular-nums mt-1">{formatARSShort(companyRevenue)}</p>
              <p className="text-[10px] text-violet-400 mt-0.5">Comisiones cobradas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Gastos empresa</p>
              <p className="text-xl font-bold text-slate-700 tabular-nums mt-1">− {formatARSShort(companyTotal)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{expenses.length} registros</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <p className={`text-[10px] uppercase tracking-wide font-semibold ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>Utilidad neta</p>
              <p className={`text-xl font-bold tabular-nums mt-1 ${netProfit >= 0 ? "text-emerald-800" : "text-rose-700"}`}>{formatARSShort(netProfit)}</p>
              <p className={`text-[10px] mt-0.5 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {companyRevenue > 0 ? `${Math.round((netProfit / companyRevenue) * 100)}% margen` : "Sin comisiones"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Expense list */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Gastos empresa</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => { setEditingExpense(null); setFormOpen(true); }}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {expenses.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    <p className="font-medium">Sin gastos registrados</p>
                    <p className="text-xs mt-1">Registrá los gastos propios de Gesting</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CAT_COLORS[e.category] ?? "#94a3b8" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {COMPANY_EXPENSE_CATEGORY_LABELS[e.category]} · {formatDate(e.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold tabular-nums">{formatARS(e.amount)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie by category */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold">Por categoría</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [formatARS(v), "Gasto"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                    Sin gastos registrados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── PROPIEDAD VIEW ────────────────────────────────────────────────────── */}
      {activeView === "propiedad" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UniverseBadge universe="propietario" />
                <p className="text-xs font-semibold text-amber-800">Gastos de propiedades — NO impactan en la utilidad de Gesting</p>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Limpieza, mantenimiento, insumos, amenities, reparaciones y gastos operativos de las unidades.
                Son <strong>imputables al propietario</strong> y se descuentan en la liquidación correspondiente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-[10px] text-amber-500 uppercase tracking-wide font-semibold">Total gastos propiedades</p>
              <p className="text-xl font-bold text-amber-800 tabular-nums mt-1">{formatARSShort(propertyTotal)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Registros</p>
              <p className="text-xl font-bold text-slate-700 tabular-nums mt-1">{propertyExpenses.length}</p>
            </div>
          </div>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Detalle gastos propiedades</CardTitle>
                <Link href="/expenses">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Ver gestión completa →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-3">
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500">
                  Vista de solo lectura. Estos gastos no reducen la rentabilidad de Gesting. La gestión completa está en <Link href="/expenses" className="text-blue-600 underline">Gastos operativos</Link>.
                </p>
              </div>
              {propertyExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin gastos en el período</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {propertyExpenses.slice(0, 50).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                      <span className="text-lg shrink-0">{PROP_EXP_ICONS[e.category] ?? "📝"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {e.property?.name ?? "—"} · {EXPENSE_CATEGORY_LABELS[e.category]} · {formatDate(e.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums">{formatARS(e.amount)}</p>
                        <Badge variant="secondary" className="text-[9px] mt-0.5">Propietario</Badge>
                      </div>
                    </div>
                  ))}
                  {propertyExpenses.length > 50 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      Mostrando 50 de {propertyExpenses.length} registros.{" "}
                      <Link href="/expenses" className="text-blue-600 underline">Ver todos</Link>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <CompanyExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSaved={handleSaved}
        editing={editingExpense}
      />
    </div>
  );
}
