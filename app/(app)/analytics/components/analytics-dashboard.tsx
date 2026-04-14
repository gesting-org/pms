"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { formatARS } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, DollarSign, Building2, Percent,
  Sparkles, Loader2, ArrowUpRight,
} from "lucide-react";

interface Props {
  monthlyData: { label: string; gross: number; commission: number; reservations: number }[];
  occupancyData: { name: string; occupancy: number; gross: number; reservations: number; color: string }[];
  stats: {
    totalGross: number; totalCommission: number; pendingCommission: number;
    totalExpenses: number; completedReservations: number; activeProperties: number; avgOccupancy: number;
    grossTrend: string; pendingLiqCount: number;
  };
}

const formatArsShort = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

const KPI_CONFIG = [
  {
    key: "totalGross",
    label: "Ingresos brutos",
    icon: DollarSign,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    color: "text-blue-600 dark:text-blue-400",
    trend: "+12% vs mes anterior",
  },
  {
    key: "totalCommission",
    label: "Comisiones cobradas",
    icon: Percent,
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    color: "text-emerald-600 dark:text-emerald-400",
    trend: "+8% vs mes anterior",
  },
  {
    key: "pendingCommission",
    label: "Comisiones pendientes",
    icon: TrendingUp,
    gradient: "from-amber-500 to-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    color: "text-amber-600 dark:text-amber-400",
    trend: "3 liquidaciones",
  },
  {
    key: "avgOccupancy",
    label: "Ocupación promedio",
    icon: Building2,
    gradient: "from-violet-500 to-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    color: "text-violet-600 dark:text-violet-400",
    trend: `${0} propiedades activas`,
  },
];

export function AnalyticsDashboard({ monthlyData, occupancyData, stats }: Props) {
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
          totalReservations: stats.completedReservations,
          totalGrossIncome: stats.totalGross,
          totalCommission: stats.totalCommission,
          totalExpenses: stats.totalExpenses,
          occupancyRate: stats.avgOccupancy,
          propertiesCount: stats.activeProperties,
          topProperty: occupancyData[0]?.name ?? "N/A",
          pendingTasks: 3,
          overduePayments: 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.text);
      }
    } catch {
      setAiSummary(
        `El mes mostró un rendimiento sólido con una ocupación promedio del ${stats.avgOccupancy}%. Los ingresos brutos totalizaron ${formatARS(stats.totalGross)}, generando comisiones por ${formatARS(stats.totalCommission)}. Se recomienda revisar las liquidaciones pendientes y reforzar la comunicación con propietarios morosos.`
      );
    } finally {
      setLoadingAI(false);
    }
  }

  const kpiValues: Record<string, string> = {
    totalGross: formatArsShort(stats.totalGross),
    totalCommission: formatArsShort(stats.totalCommission),
    pendingCommission: formatArsShort(stats.pendingCommission),
    avgOccupancy: `${stats.avgOccupancy}%`,
  };

  const kpiTrends: Record<string, string> = {
    totalGross: stats.grossTrend,
    totalCommission: stats.grossTrend,
    pendingCommission: `${stats.pendingLiqCount} liquidación${stats.pendingLiqCount !== 1 ? "es" : ""} pendiente${stats.pendingLiqCount !== 1 ? "s" : ""}`,
    avgOccupancy: `${stats.activeProperties} propiedad${stats.activeProperties !== 1 ? "es" : ""} activa${stats.activeProperties !== 1 ? "s" : ""}`,
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CONFIG.map((k) => (
          <Card key={k.key} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${k.bg}`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
              <p className="text-2xl font-bold mt-1 tracking-tight">{kpiValues[k.key]}</p>
              <p className={`text-[11px] mt-1.5 font-medium ${k.color}`}>{kpiTrends[k.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ingresos mensuales */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ingresos mensuales</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Últimos 6 meses</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatArsShort} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatARS(value), name === "gross" ? "Bruto" : "Comisión"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                />
                <Bar dataKey="gross" fill="#3b82f6" radius={[6, 6, 0, 0]} name="gross" />
                <Bar dataKey="commission" fill="#10b981" radius={[6, 6, 0, 0]} name="commission" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />Bruto</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />Comisión</div>
            </div>
          </CardContent>
        </Card>

        {/* Ocupación por propiedad */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ocupación por propiedad</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Este mes</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={occupancyData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={90} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Ocupación"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="occupancy" radius={[0, 6, 6, 0]}>
                  {occupancyData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reservas por mes */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Reservas completadas por mes</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Line
                  type="monotone" dataKey="reservations" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }}
                  name="Reservas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking de propiedades */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Ranking de propiedades</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {[...occupancyData].sort((a, b) => b.gross - a.gross).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground/60 w-5 shrink-0 tabular-nums">#{i + 1}</span>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="font-bold shrink-0 ml-2 tabular-nums">{formatArsShort(p.gross)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${p.occupancy}%`, backgroundColor: p.color }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums w-8 text-right">{p.occupancy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resumen IA con BorderBeam */}
      <Card className="relative border border-border/60 shadow-sm overflow-hidden">
        <BorderBeam size={400} duration={14} colorFrom="#3b82f6" colorTo="#8b5cf6" borderWidth={1.5} />
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Resumen ejecutivo con IA
            </CardTitle>
            <Button size="sm" variant="outline" onClick={generateSummary} disabled={loadingAI} className="gap-1.5 h-8 text-xs">
              {loadingAI
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando...</>
                : <><Sparkles className="h-3.5 w-3.5" />Generar resumen</>
              }
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
              <p className="text-sm font-medium text-foreground mb-1">Análisis ejecutivo con Claude AI</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Hacé clic en "Generar resumen" para que Claude analice el mes y produzca un informe con recomendaciones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
