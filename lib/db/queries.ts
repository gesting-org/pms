/**
 * Centralized DB query functions for all PMS entities.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PropertyWithOwner = Prisma.PropertyGetPayload<{
  include: { owner: true; platforms: true };
}>;

export type ReservationWithRel = Prisma.ReservationGetPayload<{
  include: { property: true; guest: true };
}>;

export type TaskWithProperty = Prisma.TaskGetPayload<{
  include: { property: true };
}>;

export type LiquidationWithRel = Prisma.LiquidationGetPayload<{
  include: { property: { include: { owner: true } } };
}>;

export type ContractWithRel = Prisma.ManagementContractGetPayload<{
  include: { property: true; owner: true };
}>;

export type ExpenseWithProperty = Prisma.ExpenseGetPayload<{
  include: { property: true };
}>;

export type MessageWithRel = Prisma.MessageGetPayload<{
  include: { guest: true; property: true; reservation: true };
}>;

// ─── Properties ───────────────────────────────────────────────────────────────

export async function getProperties(): Promise<PropertyWithOwner[]> {
  return prisma.property.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { owner: true, platforms: true },
  });
}

// ─── Guests (Tenants) ─────────────────────────────────────────────────────────

export async function getGuests() {
  return prisma.guest.findMany({
    where: { deletedAt: null },
    orderBy: { lastName: "asc" },
    include: { reservations: { include: { property: true }, orderBy: { checkIn: "desc" } } },
  });
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export async function getReservations(): Promise<ReservationWithRel[]> {
  return prisma.reservation.findMany({
    orderBy: { checkIn: "desc" },
    include: { property: true, guest: true },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<TaskWithProperty[]> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  return prisma.task.findMany({
    where: {
      OR: [
        { status: { not: "COMPLETED" } },
        { completedAt: { gt: twoDaysAgo } },
      ],
    },
    orderBy: { scheduledDate: "asc" },
    include: { property: true },
  });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<ExpenseWithProperty[]> {
  return prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { property: true },
  });
}

// ─── Liquidations ─────────────────────────────────────────────────────────────

export async function getLiquidations(): Promise<LiquidationWithRel[]> {
  return prisma.liquidation.findMany({
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: { property: { include: { owner: true } } },
  });
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export async function getContracts(): Promise<ContractWithRel[]> {
  return prisma.managementContract.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: true, owner: true },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(): Promise<MessageWithRel[]> {
  return prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: { guest: true, property: true, reservation: true },
  });
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Monthly data for chart: last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      label: d.toLocaleString("es-AR", { month: "short" }),
    };
  });

  const [
    totalProps,
    activeProps,
    maintenanceProps,
    activeReservations,
    upcomingReservations,
    completedReservations,
    pendingTasks,
    unreadMessages,
    pendingLiqs,
    expiringContracts,
    monthlyRevenue,
    monthlyCommission,
    monthlyRevenueData,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({ where: { status: "MAINTENANCE" } }),
    prisma.reservation.count({ where: { status: "IN_PROGRESS" } }),
    prisma.reservation.count({ where: { status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { status: "COMPLETED" } }),
    prisma.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.message.count({ where: { direction: "INBOUND", status: { not: "READ" } } }),
    prisma.liquidation.count({ where: { status: { in: ["PENDING", "SENT"] } } }),
    prisma.managementContract.count({ where: { status: { in: ["EXPIRING_SOON", "EXPIRED"] } } }),
    prisma.reservation.aggregate({
      where: { status: "COMPLETED", checkIn: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { grossAmount: true },
    }),
    prisma.liquidation.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { commissionAmount: true },
    }),
    // Last 6 months revenue for chart
    Promise.all(months.map((m) =>
      prisma.reservation.aggregate({
        where: { status: "COMPLETED", checkIn: { gte: m.start, lte: m.end } },
        _sum: { grossAmount: true },
      }).then((r) => ({
        mes: m.label,
        gross: Number(r._sum.grossAmount ?? 0),
      }))
    )),
  ]);

  const grossThisMonth = Number(monthlyRevenue._sum.grossAmount ?? 0);
  const commissionThisMonth = Number(monthlyCommission._sum.commissionAmount ?? 0);

  // Normalize chart data to percentage of max for SVG rendering
  const maxGross = Math.max(...monthlyRevenueData.map((d) => d.gross), 1);
  const chartData = monthlyRevenueData.map((d) => ({
    mes: d.mes,
    gross: d.gross,
    pct: Math.round((d.gross / maxGross) * 100),
  }));

  return {
    totalProps, activeProps, maintenanceProps,
    activeReservations, upcomingReservations, completedReservations,
    grossThisMonth, commissionThisMonth,
    pendingTasks, unreadMessages, pendingLiqs, expiringContracts,
    chartData,
  };
}
