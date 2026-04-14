import { formatARS } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface KPIsProps {
  totalProperties: number;
  activeReservations: number;
  monthGross: number;
  pendingTasks: number;
}

export function DashboardKPIs({ totalProperties, activeReservations, monthGross, pendingTasks }: KPIsProps) {
  const kpis = [
    {
      label: "Propiedades activas",
      value: totalProperties.toString(),
      trend: "gestionadas",
      trendColor: "text-[#717171]",
    },
    {
      label: "Reservas en curso",
      value: activeReservations.toString(),
      trend: "este momento",
      trendColor: "text-emerald-600",
    },
    {
      label: "Ingresos del mes",
      value: formatARS(monthGross),
      trend: "bruto acumulado",
      trendColor: "text-[#717171]",
    },
    {
      label: "Tareas pendientes",
      value: pendingTasks.toString(),
      trend: pendingTasks > 5 ? "revisar pronto" : "al día",
      trendColor: pendingTasks > 5 ? "text-amber-600" : "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-2xl border border-[#EBEBEB] shadow-card p-6 space-y-3"
        >
          <p className="text-sm text-[#717171] font-medium">{kpi.label}</p>
          <p className="text-3xl font-bold text-[#222222] leading-none tracking-tight">{kpi.value}</p>
          <p className={`text-xs font-medium flex items-center gap-1 ${kpi.trendColor}`}>
            <TrendingUp className="h-3 w-3" />
            {kpi.trend}
          </p>
        </div>
      ))}
    </div>
  );
}
