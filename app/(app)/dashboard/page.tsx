export const revalidate = 60; // revalidate every 60 seconds

import { Topbar } from "@/components/layout/topbar";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/lib/db/queries";
import { formatARS, formatDate } from "@/lib/utils";
import {
  FileText, CheckSquare, CalendarDays,
  Plus, ChevronRight, Wrench, TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Buildings2, Profile2User, MoneyRecive,
  Warning2, Timer,
} from "iconsax-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "./components/kpi-card";
import { GlowSection } from "./components/glow-section";

export const metadata = { title: "Dashboard — Gesting PMS" };

/* ─── Design tokens ──────────────────────────────────────────────── */
const ROW_HOVER = "hover:bg-slate-50/80 transition-colors duration-150";
const SECTION_HEADER = "flex items-center justify-between px-6 py-4 border-b border-slate-100";
const DIVIDER = "divide-y divide-slate-100";

const AVATAR_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"];

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(String(v));
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, color = "#3B82F6", size = "sm" }: {
  name: string; color?: string; size?: "sm" | "md" | "lg";
}) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const sz =
    size === "lg" ? "w-12 h-12 text-sm" :
    size === "md" ? "w-10 h-10 text-[13px]" :
    "w-9 h-9 text-[12px]";
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0 ring-2 ring-white", sz)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────── */
function Badge({ variant, children }: {
  variant: "success" | "warning" | "danger" | "info" | "neutral" | "overdue";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger:  "bg-rose-50 text-rose-600",
    info:    "bg-blue-50 text-blue-700",
    neutral: "bg-slate-100 text-slate-600",
    overdue: "bg-rose-50 text-rose-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[variant])}>
      {children}
    </span>
  );
}

/* ─── SectionCard ────────────────────────────────────────────────── */
function SectionCard({ title, icon: Icon, count, countColor = "bg-slate-100 text-slate-600", action, children }: {
  title: string;
  icon?: React.ElementType;
  count?: number;
  countColor?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <GlowSection>
      <div className={SECTION_HEADER}>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.8} />}
          <h2 className="text-[15px] font-semibold text-slate-800 tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold", countColor)}>
              {count}
            </span>
          )}
        </div>
        {action && (
          <Link href={action.href} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
            {action.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </GlowSection>
  );
}

/* ─── Empty state ────────────────────────────────────────────────── */
function Empty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default async function DashboardPage() {
  const now = new Date();

  const [s, activeReservationsRaw, urgentTasksRaw, expiringContractsRaw, pendingLiquidationsRaw, recentContractsRaw] = await Promise.all([
    getDashboardStats(),
    prisma.reservation.findMany({
      where: { status: "IN_PROGRESS" },
      include: { property: true, guest: true },
      take: 4,
    }),
    prisma.task.findMany({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] }, priority: { in: ["URGENT", "HIGH"] } },
      include: { property: true },
      take: 4,
    }),
    prisma.managementContract.findMany({
      where: { status: { in: ["EXPIRING_SOON", "EXPIRED"] } },
      include: { property: true, owner: true },
      take: 4,
    }),
    prisma.liquidation.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      include: { property: { include: { owner: true } } },
      take: 4,
    }),
    prisma.managementContract.findMany({
      include: { property: true, owner: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const activeReservations = activeReservationsRaw.map((r) => ({
    id: r.id,
    property: r.property,
    guest: r.guest,
    checkIn: toDateStr(r.checkIn),
    checkOut: toDateStr(r.checkOut),
    grossAmount: toNum(r.grossAmount),
  }));

  const pendingLiquidations = pendingLiquidationsRaw.map((l, i) => {
    const due = l.dueDate;
    const diffDays = Math.round((now.getTime() - due.getTime()) / 86400000);
    return {
      id: l.id,
      property: l.property,
      owner: l.property.owner,
      netToOwner: toNum(l.netToOwner),
      dueDate: toDateStr(l.dueDate),
      status: l.status,
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      daysOverdue: diffDays > 0 ? diffDays : 0,
    };
  });

  const recentActivity = [
    ...activeReservations.slice(0, 2).map((r, i) => ({
      id: r.id,
      type: "reservation" as const,
      name: `${r.guest?.firstName} ${r.guest?.lastName}`,
      action: "reserva activa",
      detail: r.property?.name,
      date: r.checkIn,
      amount: r.grossAmount,
      color: AVATAR_COLORS[i],
    })),
    ...recentContractsRaw.slice(0, 3).map((c, i) => ({
      id: c.id,
      type: "contract" as const,
      name: c.ownerFullName,
      action: "contrato de gestión",
      detail: c.property?.name ?? "",
      date: toDateStr(c.startDate),
      amount: null as number | null,
      color: AVATAR_COLORS[(i + 2) % AVATAR_COLORS.length],
    })),
  ].slice(0, 5);

  const totalProps = s.totalProps;
  const occupiedProps = s.activeReservations;
  const occupancyPct = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0;
  const totalDebt = pendingLiquidations.reduce((acc, l) => acc + l.netToOwner, 0);

  /* KPI data */
  const kpis = [
    {
      href: "/properties",
      label: "Propiedades activas",
      value: String(s.activeProps),
      sub: `de ${totalProps} totales`,
      icon: <Buildings2 size={24} color="#2563EB" variant="Bulk" />,
      iconBg: "bg-blue-50",
      accent: null,
    },
    {
      href: "/reservations",
      label: "Unidades ocupadas",
      value: `${occupiedProps} / ${totalProps}`,
      sub: `${s.upcomingReservations} próximas confirmadas`,
      icon: <Profile2User size={24} color="#0D9488" variant="Bulk" />,
      iconBg: "bg-teal-50",
      accent: { label: `${occupancyPct}%`, color: "bg-teal-100 text-teal-700" },
    },
    {
      href: "/contracts",
      label: "Contratos por vencer",
      value: String(s.expiringContracts),
      sub: s.expiringContracts > 0 ? "Requiere atención" : "Todo al día",
      icon: <Warning2 size={24} color="#F59E0B" variant="Bulk" />,
      iconBg: "bg-amber-50",
      accent: s.expiringContracts > 0
        ? { label: "Atención", color: "bg-amber-100 text-amber-700" }
        : null,
    },
    {
      href: "/liquidations",
      label: "Deuda acumulada",
      value: formatARS(totalDebt),
      sub: "Obligaciones pendientes",
      icon: <MoneyRecive size={24} color="#F43F5E" variant="Bulk" />,
      iconBg: "bg-rose-50",
      accent: pendingLiquidations.length > 0
        ? { label: `${pendingLiquidations.length} pend.`, color: "bg-rose-100 text-rose-600" }
        : null,
    },
  ];

  /* Chart — real monthly data from DB */
  const chartData = s.chartData ?? [];
  const svgW = 300; const svgH = 90;
  const pts = chartData.length > 1 ? chartData.map((d, i) => ({
    x: (i / (chartData.length - 1)) * svgW,
    y: svgH - ((d.pct ?? 0) / 100) * svgH,
  })) : [{ x: 0, y: svgH / 2 }, { x: svgW, y: svgH / 2 }];
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M ${pts[0].x},${svgH} ` +
    pts.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${pts[pts.length - 1].x},${svgH} Z`;

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60">
      <Topbar title="Dashboard" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in max-w-[1440px] w-full mx-auto">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Control y gestión de propiedades
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 shrink-0 scrollbar-thin">
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo contrato</span>
              <span className="sm:hidden">Contrato</span>
            </Link>
            <Link
              href="/reservations/new"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap shrink-0"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva reserva</span>
              <span className="sm:hidden">Reserva</span>
            </Link>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva propiedad</span>
              <span className="sm:hidden">Propiedad</span>
            </Link>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {kpis.map((k) => (
            <KpiCard
              key={k.href}
              href={k.href}
              label={k.label}
              value={k.value}
              sub={k.sub}
              icon={k.icon}
              iconBg={k.iconBg}
              accent={k.accent}
            />
          ))}
        </div>

        {/* ── Main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

          {/* ── Col 1: Actividad reciente ──────────────────────────── */}
          <GlowSection className="lg:col-span-1 flex flex-col">
            <div className={SECTION_HEADER}>
              <div className="flex items-center gap-3">
                <Timer size={16} color="#94A3B8" variant="Bulk" />
                <h2 className="text-[15px] font-semibold text-slate-800 tracking-tight">Actividad reciente</h2>
              </div>
              <Link href="/reservations" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
                Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className={DIVIDER}>
              {recentActivity.map((item) => (
                <div key={item.id} className={cn("flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5", ROW_HOVER)}>
                  <Avatar name={item.name} color={item.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                      {item.name.split(" ")[0]}{" "}
                      <span className="font-normal text-slate-500">{item.action}</span>
                    </p>
                    <p className="text-xs text-blue-600 truncate mt-1 font-medium">{item.detail}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-slate-400">{item.date?.split("-").reverse().join("/")}</p>
                    {item.amount && (
                      <p className="text-sm font-bold text-slate-700 tabular-nums">{formatARS(item.amount)}</p>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagos pendientes mini */}
            <div className="border-t border-slate-100 mt-auto hidden sm:block">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80">
                <div className="flex items-center gap-2.5">
                  <Warning2 size={16} color="#F59E0B" variant="Bulk" />
                  <h3 className="text-[14px] font-semibold text-slate-800">Pagos pendientes</h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                    {pendingLiquidations.length}
                  </span>
                </div>
                <Link href="/liquidations" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                  Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className={DIVIDER}>
                {pendingLiquidations.slice(0, 2).map((l) => (
                  <Link key={l.id} href={`/liquidations/${l.id}`}
                    className={cn("flex items-center gap-4 px-6 py-4", ROW_HOVER)}>
                    <Avatar name={`${l.owner?.firstName} ${l.owner?.lastName}`} color={l.color} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {l.owner?.firstName} {l.owner?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{l.property?.name}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{formatARS(l.netToOwner)}</p>
                      {l.daysOverdue > 0 ? (
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {l.daysOverdue} días
                        </span>
                      ) : (
                        <p className="text-[11px] text-slate-400">{formatDate(l.dueDate)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </GlowSection>

          {/* ── Col 2: Pagos pendientes + Contratos por vencer ──────── */}
          <div className="flex flex-col gap-5 lg:gap-6">

            <SectionCard
              title="Pagos pendientes"
              count={pendingLiquidations.length}
              countColor="bg-amber-100 text-amber-700"
              action={{ label: "Ver todos", href: "/liquidations" }}
            >
              <div className={DIVIDER}>
                {pendingLiquidations.length === 0 ? (
                  <Empty message="Sin pagos pendientes" />
                ) : pendingLiquidations.map((l) => (
                  <Link key={l.id} href={`/liquidations/${l.id}`}
                    className={cn("flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5", ROW_HOVER)}>
                    <Avatar name={`${l.owner?.firstName} ${l.owner?.lastName}`} color={l.color} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {l.owner?.firstName} {l.owner?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Vence {formatDate(l.dueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{formatARS(l.netToOwner)}</p>
                      {l.daysOverdue > 0 ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700">
                          {l.daysOverdue} días
                        </span>
                      ) : (
                        <Badge variant="warning">Pendiente</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Contratos por vencer"
              icon={FileText}
              count={expiringContractsRaw.length}
              countColor="bg-slate-100 text-slate-600"
              action={{ label: "Ver todos", href: "/contracts" }}
            >
              <div className={DIVIDER}>
                {expiringContractsRaw.length === 0 ? (
                  <Empty message="Sin contratos por vencer" />
                ) : expiringContractsRaw.map((c, i) => (
                  <Link key={c.id} href={`/contracts/${c.id}`}
                    className={cn("flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5", ROW_HOVER)}>
                    <Avatar
                      name={c.ownerFullName}
                      color={AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length]}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.ownerFullName}</p>
                      <p className="text-xs text-slate-400 truncate mt-1">{c.property?.name}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-sm font-semibold text-slate-700">{toDateStr(c.endDate).split("-").reverse().join("/")}</p>
                      {c.status === "EXPIRED" ? (
                        <Badge variant="danger">Vencido</Badge>
                      ) : (
                        <Badge variant="warning">Por vencer</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ── Col 3: Tareas urgentes + Histórico de ingresos ──────── */}
          <div className="flex flex-col gap-5 lg:gap-6">

            <SectionCard
              title="Tareas urgentes"
              icon={CheckSquare}
              count={urgentTasksRaw.length}
              countColor="bg-slate-100 text-slate-600"
              action={{ label: "Ver todas", href: "/tasks" }}
            >
              <div className={DIVIDER}>
                {urgentTasksRaw.length === 0 ? (
                  <Empty message="Sin tareas urgentes" />
                ) : urgentTasksRaw.map((t) => {
                  const isUrgent = t.priority === "URGENT";
                  const isHigh = t.priority === "HIGH";
                  const TaskIcon = t.type === "CLEANING" ? CheckSquare
                    : t.type === "REPAIR" || t.type === "MAINTENANCE" ? Wrench
                    : FileText;
                  return (
                    <div key={t.id} className={cn("flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5", ROW_HOVER)}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isUrgent ? "bg-rose-50" : isHigh ? "bg-amber-50" : "bg-blue-50"
                      )}>
                        <TaskIcon className={cn("h-5 w-5",
                          isUrgent ? "text-rose-500" : isHigh ? "text-amber-500" : "text-blue-500"
                        )} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                        <p className="text-xs text-slate-400 truncate mt-1">{t.property?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isUrgent ? (
                          <Badge variant="danger">Urgente</Badge>
                        ) : isHigh ? (
                          <Badge variant="warning">Alta</Badge>
                        ) : (
                          <Badge variant="info">Media</Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Histórico de ingresos */}
            <GlowSection>
              <div className={SECTION_HEADER}>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                  <h2 className="text-[15px] font-semibold text-slate-800 tracking-tight">Histórico de ingresos</h2>
                </div>
                {(() => {
                  const data = s.chartData ?? [];
                  if (data.length >= 2) {
                    const prev = data[data.length - 2].gross;
                    const cur = data[data.length - 1].gross;
                    if (prev > 0) {
                      const pct = Math.round(((cur - prev) / prev) * 100);
                      return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pct >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>{pct >= 0 ? "↑" : "↓"} {Math.abs(pct)}%</span>;
                    }
                  }
                  return null;
                })()}
              </div>

              <div className="px-6 pt-5 pb-3">
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
                  {formatARS(s.grossThisMonth)}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Comisión:{" "}
                  <span className="font-bold text-emerald-600">{formatARS(s.commissionThisMonth)}</span>
                </p>
              </div>

              <div className="px-5 pb-3">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-24" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#lineGrad)" />
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3}
                      fill={i === pts.length - 1 ? "#10B981" : "#fff"}
                      stroke="#10B981" strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="flex justify-between mt-1.5">
                  {chartData.map((d) => (
                    <span key={d.mes} className="text-[10px] font-semibold text-slate-400">{d.mes}</span>
                  ))}
                </div>
              </div>

              {activeReservations.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-4 space-y-3.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    En curso ahora
                  </p>
                  {activeReservations.slice(0, 2).map((r) => (
                    <Link key={r.id} href={`/reservations/${r.id}`}
                      className="flex items-center gap-3.5 group">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 ring-4 ring-emerald-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                          {r.property?.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Hasta {formatDate(r.checkOut)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 shrink-0 tabular-nums">
                        {formatARS(r.grossAmount)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </GlowSection>
          </div>

        </div>
      </div>
    </div>
  );
}
