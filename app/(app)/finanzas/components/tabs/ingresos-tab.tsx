"use client";

import { formatARS, formatARSShort, PLATFORM_LABELS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { FinancialData } from "@/lib/db/finanzas-queries";
import { Info } from "lucide-react";

interface IngresosTabProps {
  data: FinancialData;
}

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "#FF5A5F",
  BOOKING: "#003580",
  DIRECT: "#10b981",
  OTHER: "#94a3b8",
};

export function IngresosTab({ data }: IngresosTabProps) {
  const { grossTotal, totalReservations, totalNights, grossByPlatform, grossByProperty, monthlySeries } = data;

  const avgPerReservation = totalReservations > 0 ? grossTotal / totalReservations : 0;
  const topPlatform = [...grossByPlatform].sort((a, b) => b.amount - a.amount)[0];

  // Monthly bar data
  const monthlyData = monthlySeries.map((m) => ({
    label: m.label,
    bruto: m.gross,
  }));

  // Pie data
  const pieData = grossByPlatform.map((p) => ({
    name: PLATFORM_LABELS[p.platform] ?? p.platform,
    value: p.amount,
    color: PLATFORM_COLORS[p.platform] ?? "#94a3b8",
  }));

  // Property ranking
  const maxGross = Math.max(...grossByProperty.map((p) => p.gross), 1);

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ingreso bruto total", value: formatARSShort(grossTotal), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Reservas", value: String(totalReservations), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Noches vendidas", value: String(totalNights), color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Promedio por reserva", value: formatARSShort(avgPerReservation), color: "text-slate-600", bg: "bg-slate-50" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-200/70 bg-white p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{k.label}</p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Important note */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          <strong>Ingreso bruto ≠ ganancia de Gesting.</strong> El ingreso bruto es el flujo total de reservas.
          La <strong>comisión de gestión</strong> (visible en el tab Resumen y Gastos) es el ingreso real de la empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly gross bar chart */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ingresos brutos mensuales</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Últimos 12 meses</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatARSShort}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatARS(v), "Ingreso bruto"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                />
                <Bar dataKey="bruto" fill="#3b82f6" radius={[6, 6, 0, 0]} name="bruto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform pie */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Distribución por canal</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatARS(v), "Ingreso bruto"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                Sin datos de reservas en el período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property ranking table */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold">Ranking por propiedad</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {grossByProperty.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos en el período</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2 border-b">
                <span className="col-span-2">Propiedad</span>
                <span className="text-right">Reservas</span>
                <span className="text-right">Noches</span>
                <span className="text-right">Bruto</span>
              </div>
              {grossByProperty.map((p, i) => (
                <div key={p.propertyId} className="grid grid-cols-5 gap-2 items-center py-2 rounded-lg hover:bg-slate-50 px-1 -mx-1 transition-colors">
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0">#{i + 1}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.colorTag }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.ownerName}</p>
                    </div>
                  </div>
                  <span className="text-sm text-right tabular-nums">{p.count}</span>
                  <span className="text-sm text-right tabular-nums">{p.nights}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums text-blue-700">
                      {formatARSShort(p.gross)}
                    </span>
                    <div className="h-1 mt-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${Math.round((p.gross / maxGross) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
