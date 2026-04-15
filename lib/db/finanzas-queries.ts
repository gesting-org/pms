/**
 * Financial data aggregation queries for Gestión Financiera tab.
 *
 * 3-universe model:
 *  Universe 1 — Reservas  (gross booking revenue)
 *  Universe 2 — Propietario (netToOwner from liquidations)
 *  Universe 3 — Empresa (commission revenue minus company expenses = net profit)
 */

import { prisma } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlySeries {
  label: string;
  year: number;
  month: number;
  gross: number;
  commission: number;
  companyExpenses: number;
  margin: number;
}

export interface PlatformBreakdown {
  platform: string;
  amount: number;
  count: number;
}

export interface PropertyBreakdown {
  propertyId: string;
  name: string;
  colorTag: string;
  ownerName: string;
  gross: number;
  nights: number;
  count: number;
  commission: number;
}

export interface LiquidationStatusSummary {
  status: string;
  count: number;
  total: number;
}

export interface FinancialData {
  // Universe 1 — Reservas
  grossTotal: number;
  grossThisMonth: number;
  platformFeeTotal: number;
  totalNights: number;
  totalReservations: number;
  grossByPlatform: PlatformBreakdown[];
  grossByProperty: PropertyBreakdown[];

  // Universe 2 — Propietario
  ownerPaid: number;
  ownerPending: number;
  commissionGenerated: number;

  // Universe 3 — Empresa
  companyRevenue: number;
  companyExpensesTotal: number;
  netProfit: number;
  margin: number;

  // Time series (last 12 months)
  monthlySeries: MonthlySeries[];

  // Liquidation overview
  liquidationSummary: LiquidationStatusSummary[];
  activeProperties: number;
}

// ─── Main query ───────────────────────────────────────────────────────────────

export async function getFinancialData(
  filterYear?: number,
  filterMonth?: number
): Promise<FinancialData> {
  const now = new Date();

  // Build date range for period filter (if provided)
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;
  if (filterYear && filterMonth) {
    periodStart = new Date(filterYear, filterMonth - 1, 1);
    periodEnd = new Date(filterYear, filterMonth, 0, 23, 59, 59);
  } else if (filterYear) {
    periodStart = new Date(filterYear, 0, 1);
    periodEnd = new Date(filterYear, 11, 31, 23, 59, 59);
  }

  // This month bounds (for "este mes" KPI)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Last 12 months series
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      label: d.toLocaleString("es-AR", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    };
  });

  // Reservation where clause
  const resWhere = {
    status: { in: ["COMPLETED", "IN_PROGRESS"] as any },
    ...(periodStart && { checkIn: { gte: periodStart, lte: periodEnd } }),
  };

  const [
    grossAgg,
    grossThisMonthAgg,
    totalReservationCount,
    platformGroups,
    propertiesWithData,
    ownerPaidAgg,
    ownerPendingAgg,
    commissionGeneratedAgg,
    companyRevenueAgg,
    companyExpensesAgg,
    liquidationCounts,
    activeProperties,
    monthlySeries,
  ] = await Promise.all([
    // 1. Total gross (Universe 1)
    prisma.reservation.aggregate({
      where: resWhere,
      _sum: { grossAmount: true, platformFee: true, nights: true },
      _count: { id: true },
    }),

    // 2. Gross this month
    prisma.reservation.aggregate({
      where: { status: { in: ["COMPLETED", "IN_PROGRESS"] }, checkIn: { gte: thisMonthStart, lte: thisMonthEnd } },
      _sum: { grossAmount: true },
    }),

    // 3. Total reservation count
    prisma.reservation.count({ where: resWhere }),

    // 4. By platform
    prisma.reservation.groupBy({
      by: ["platform"],
      where: resWhere,
      _sum: { grossAmount: true },
      _count: { id: true },
    }),

    // 5. Properties with aggregated reservation data
    prisma.property.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        reservations: {
          where: resWhere,
          select: { grossAmount: true, nights: true },
        },
        liquidations: {
          select: { commissionAmount: true },
        },
      },
    }),

    // 6. Owner paid (Universe 2) — netToOwner on PAID liquidations
    prisma.liquidation.aggregate({
      where: {
        status: "PAID",
        ...(periodStart && { paidAt: { gte: periodStart, lte: periodEnd } }),
      },
      _sum: { netToOwner: true },
    }),

    // 7. Owner pending
    prisma.liquidation.aggregate({
      where: { status: { in: ["PENDING", "SENT", "OVERDUE"] } },
      _sum: { netToOwner: true },
    }),

    // 8. Commission generated (all liquidations)
    prisma.liquidation.aggregate({
      _sum: { commissionAmount: true },
    }),

    // 9. Company revenue = commission on PAID liquidations (Universe 3)
    prisma.liquidation.aggregate({
      where: {
        status: "PAID",
        ...(periodStart && { paidAt: { gte: periodStart, lte: periodEnd } }),
      },
      _sum: { commissionAmount: true },
    }),

    // 10. Company expenses in period
    prisma.companyExpense.aggregate({
      where: periodStart ? { date: { gte: periodStart, lte: periodEnd } } : undefined,
      _sum: { amount: true },
    }),

    // 11. Liquidation counts by status
    Promise.all(
      ["PENDING", "SENT", "PAID", "OVERDUE"].map(async (status) => {
        const agg = await prisma.liquidation.aggregate({
          where: { status: status as any },
          _sum: { netToOwner: true },
          _count: { id: true },
        });
        return {
          status,
          count: agg._count.id,
          total: Number(agg._sum.netToOwner ?? 0),
        };
      })
    ),

    // 12. Active properties count
    prisma.property.count({ where: { status: "ACTIVE", deletedAt: null } }),

    // 13. Monthly series (12 months)
    Promise.all(
      months.map(async (m) => {
        const [grossRes, commRes, expRes] = await Promise.all([
          prisma.reservation.aggregate({
            where: { status: { in: ["COMPLETED", "IN_PROGRESS"] }, checkIn: { gte: m.start, lte: m.end } },
            _sum: { grossAmount: true },
          }),
          prisma.liquidation.aggregate({
            where: { status: "PAID", paidAt: { gte: m.start, lte: m.end } },
            _sum: { commissionAmount: true },
          }),
          prisma.companyExpense.aggregate({
            where: { date: { gte: m.start, lte: m.end } },
            _sum: { amount: true },
          }),
        ]);
        const gross = Number(grossRes._sum.grossAmount ?? 0);
        const commission = Number(commRes._sum.commissionAmount ?? 0);
        const companyExpenses = Number(expRes._sum.amount ?? 0);
        const margin = commission > 0 ? Math.round(((commission - companyExpenses) / commission) * 100) : 0;
        return { label: m.label, year: m.year, month: m.month, gross, commission, companyExpenses, margin };
      })
    ),
  ]);

  const companyRevenue = Number(companyRevenueAgg._sum.commissionAmount ?? 0);
  const companyExpensesTotal = Number(companyExpensesAgg._sum.amount ?? 0);
  const netProfit = companyRevenue - companyExpensesTotal;
  const margin = companyRevenue > 0 ? Math.round((netProfit / companyRevenue) * 100) : 0;

  // Build property breakdown
  const grossByProperty: PropertyBreakdown[] = propertiesWithData.map((p) => {
    const gross = p.reservations.reduce((s, r) => s + Number(r.grossAmount ?? 0), 0);
    const nights = p.reservations.reduce((s, r) => s + (r.nights ?? 0), 0);
    const commission = p.liquidations.reduce((s, l) => s + Number(l.commissionAmount ?? 0), 0);
    return {
      propertyId: p.id,
      name: p.name,
      colorTag: p.colorTag,
      ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
      gross,
      nights,
      count: p.reservations.length,
      commission,
    };
  }).sort((a, b) => b.gross - a.gross);

  // Build platform breakdown
  const grossByPlatform: PlatformBreakdown[] = platformGroups.map((g) => ({
    platform: g.platform as string,
    amount: Number(g._sum.grossAmount ?? 0),
    count: g._count.id,
  }));

  return {
    grossTotal: Number(grossAgg._sum.grossAmount ?? 0),
    grossThisMonth: Number(grossThisMonthAgg._sum.grossAmount ?? 0),
    platformFeeTotal: Number(grossAgg._sum.platformFee ?? 0),
    totalNights: Number(grossAgg._sum.nights ?? 0),
    totalReservations: totalReservationCount,
    grossByPlatform,
    grossByProperty,
    ownerPaid: Number(ownerPaidAgg._sum.netToOwner ?? 0),
    ownerPending: Number(ownerPendingAgg._sum.netToOwner ?? 0),
    commissionGenerated: Number(commissionGeneratedAgg._sum.commissionAmount ?? 0),
    companyRevenue,
    companyExpensesTotal,
    netProfit,
    margin,
    monthlySeries,
    liquidationSummary: liquidationCounts,
    activeProperties,
  };
}

// ─── Company expenses list ────────────────────────────────────────────────────

export async function getCompanyExpenses(year?: number, month?: number) {
  let where: any = {};
  if (year && month) {
    where.date = {
      gte: new Date(year, month - 1, 1),
      lte: new Date(year, month, 0, 23, 59, 59),
    };
  } else if (year) {
    where.date = {
      gte: new Date(year, 0, 1),
      lte: new Date(year, 11, 31, 23, 59, 59),
    };
  }
  return prisma.companyExpense.findMany({
    where,
    orderBy: { date: "desc" },
  });
}
