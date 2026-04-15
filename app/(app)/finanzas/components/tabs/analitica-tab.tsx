"use client";

import { useState } from "react";
import { formatARS, formatARSShort } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Sparkles, Loader2 } from "lucide-react";
import type { FinancialData } from "@/lib/db/finanzas-queries";

interface AnaliticaTabProps {
  data: FinancialData;
}

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "#FF5A5F",
  BOOKING: "#003580",
  DIRECT: "#10b981",
  OTHER: "#94a3b8",
};

export function AnaliticaTab({ data }: AnaliticaTabProps) {
  const { monthlySeries, grossByPlatform, grossByProperty } = data;
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  async function generateSummary() {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: new Date().toLocaleString("es-AR", { month: "long", year: "numeric" }),
          totalReservations: data.totalReservations,
          totalGrossIncome: data.grossTotal,
          totalCommission: data.companyRevenue,
          totalExpenses: data.companyExpensesTotal,
          occupancyRate: 0,
          propertiesCount: data.activeProperties,
          topProperty: grossByProperty[0]?.name ?? "N/A",
          pendingTasks: 0,
          overduePayments: data.liquidationSummary.find((s) => s.status === "OVERDUE")?.count ?? 0,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSummary(json.text ?? "");
      }
    } catch {
      setAiSummary(
        `El análisis del período muestra ingresos brutos de ${formatARS(data.grossTotal)}, con una comisión de ${formatARS(data.companyRevenue)} y gastos propios de ${formatARS(data.companyExpensesTotal)}, resultando en una utilidad neta de ${formatARS(data.netProfit)}.`
      );
    } finally {
      setLoadingAI(false);
    }
  }

  // Stacked bar: gross + commission + company expenses per month
  const stackedData = monthlySeries.map((m) => ({
    label: m.label,
    "Ingreso bruto": m.gross,
    "Comisión empresa": m.commission,
    "Gastos empresa": m.companyExpenses,
  }));

  // Margin line
  const marginData = monthlySeries.map((m) => ({
    label: m.label,
    margen: m.margin,
  }));

  // Platform pie
  const platformPie = grossByPlatform.map((p) => ({
    name: p.platform,
    value: p.amount,
    color: PLATFORM_COLORS[p.platform] ?? "#94a3b8",
  }));

  // Top properties bar (horizontal)
  const topProperties = [...grossByProperty].slice(0, 8).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name,
    gross: p.gross,
    color: p.colorTag,
  }));

  return (
    <div className="space-y-5">
      {/* Row 1: Stacked bar + Margin line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Evolución financiera</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Últimos 12 meses</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stackedData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatARSShort} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatARS(v), name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                />
                <Bar dataKey="Ingreso bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Comisión empresa" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos empresa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-blue-500" />Ingreso bruto</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-violet-500" />Comisión</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-rose-500" />Gastos empresa</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Margen de ganancia %</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={marginData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Margen"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Line
                  type="monotone"
                  dataKey="margen"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }}
                  name="Margen"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Platform pie + Property bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Ingresos por plataforma</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {platformPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={platformPie} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                    {platformPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatARS(v), "Ingreso"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                Sin datos en el período
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Top propiedades por facturación</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {topProperties.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProperties} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatARSShort} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [formatARS(v), "Facturación"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="gross" radius={[0, 6, 6, 0]}>
                    {topProperties.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                Sin propiedades con reservas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card className="relative border border-border/60 shadow-sm overflow-hidden">
        <BorderBeam size={400} duration={14} colorFrom="#8b5cf6" colorTo="#3b82f6" borderWidth={1.5} />
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Análisis ejecutivo con IA
            </CardTitle>
            <Button size="sm" variant="outline" onClick={generateSummary} disabled={loadingAI} className="gap-1.5 h-8 text-xs">
              {loadingAI
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando...</>
                : <><Sparkles className="h-3.5 w-3.5" />Generar análisis</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {aiSummary ? (
            <div className="rounded-xl bg-muted/40 border border-border/50 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {aiSummary}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Análisis financiero con Claude AI</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Hacé clic en "Generar análisis" para obtener un informe inteligente sobre el desempeño financiero del período.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
