import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "./components/analytics-dashboard";

export const metadata = { title: "Analíticas" };

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(String(v));
}

export default async function AnalyticsPage() {
  const [reservations, properties, liquidations, expenses] = await Promise.all([
    prisma.reservation.findMany({ select: { checkIn: true, grossAmount: true, nights: true, status: true, propertyId: true } }),
    prisma.property.findMany({ select: { id: true, name: true, colorTag: true, status: true } }),
    prisma.liquidation.findMany({ select: { commissionAmount: true, status: true } }),
    prisma.expense.findMany({ select: { amount: true } }),
  ]);

  // Ingresos por mes (últimos 6 meses)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.getMonth();
    const year = date.getFullYear();
    const label = date.toLocaleString("es-AR", { month: "short" });

    const monthRes = reservations.filter((r) => {
      const d = new Date(r.checkIn);
      return d.getMonth() === month && d.getFullYear() === year && r.status === "COMPLETED";
    });
    const gross = monthRes.reduce((s, r) => s + toNum(r.grossAmount), 0);
    const commission = gross * 0.2;
    return { label, gross, commission, reservations: monthRes.length };
  });

  // Ocupación por propiedad
  const occupancyData = properties.filter((p) => p.status === "ACTIVE").map((p) => {
    const propRes = reservations.filter((r) => r.propertyId === p.id && r.status === "COMPLETED");
    const totalNights = propRes.reduce((s, r) => s + r.nights, 0);
    const occupancy = Math.min(100, Math.round((totalNights / 30) * 100));
    const gross = propRes.reduce((s, r) => s + toNum(r.grossAmount), 0);
    return { name: p.name.substring(0, 15), occupancy, gross, reservations: propRes.length, color: p.colorTag };
  });

  // Current month vs previous month for trends
  const now = new Date();
  const curMonth = now.getMonth(); const curYear = now.getFullYear();
  const prevDate = new Date(now); prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.getMonth(); const prevYear = prevDate.getFullYear();

  const curMonthRes = reservations.filter((r) => {
    const d = new Date(r.checkIn);
    return d.getMonth() === curMonth && d.getFullYear() === curYear && r.status === "COMPLETED";
  });
  const prevMonthRes = reservations.filter((r) => {
    const d = new Date(r.checkIn);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear && r.status === "COMPLETED";
  });

  const curGross = curMonthRes.reduce((s, r) => s + toNum(r.grossAmount), 0);
  const prevGross = prevMonthRes.reduce((s, r) => s + toNum(r.grossAmount), 0);
  const grossTrend = prevGross > 0
    ? `${curGross >= prevGross ? "+" : ""}${Math.round(((curGross - prevGross) / prevGross) * 100)}% vs mes anterior`
    : curGross > 0 ? "Primer mes con ingresos" : "Sin ingresos este mes";

  const pendingLiqCount = liquidations.filter((l) => l.status !== "PAID").length;

  const stats = {
    totalGross: reservations.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + toNum(r.grossAmount), 0),
    totalCommission: liquidations.reduce((s, l) => s + toNum(l.commissionAmount), 0),
    pendingCommission: liquidations.filter((l) => l.status !== "PAID").reduce((s, l) => s + toNum(l.commissionAmount), 0),
    totalExpenses: expenses.reduce((s, e) => s + toNum(e.amount), 0),
    completedReservations: reservations.filter((r) => r.status === "COMPLETED").length,
    activeProperties: properties.filter((p) => p.status === "ACTIVE").length,
    avgOccupancy: Math.round(occupancyData.reduce((s, d) => s + d.occupancy, 0) / (occupancyData.length || 1)),
    grossTrend,
    pendingLiqCount,
  };

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Analíticas" subtitle="Resumen de gestión" />
      <div className="p-4 md:p-6 animate-fade-in">
        <AnalyticsDashboard monthlyData={monthlyData} occupancyData={occupancyData} stats={stats} />
      </div>
    </div>
  );
}
