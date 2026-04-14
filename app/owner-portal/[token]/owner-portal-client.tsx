"use client";

import { useState, useMemo } from "react";
import { formatARS, formatDate, cn } from "@/lib/utils";
import {
  Owner, Property, ManagementContract, Reservation,
  Liquidation, Expense, Task,
} from "@/lib/mock/data";
import {
  Building2, CalendarDays, TrendingUp, Download, CheckCircle2,
  Clock, AlertTriangle, Phone, Mail, ChevronRight, ArrowLeft,
  PenLine, Home, Wallet, BarChart3, FileText, Wrench,
  MapPin, Users, Bed, Bath, ExternalLink,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Props {
  owner: Owner;
  properties: Property[];
  contracts: ManagementContract[];
  reservations: Reservation[];
  liquidations: Liquidation[];
  expenses: Expense[];
  tasks: Task[];
  hideHeader?: boolean;
}

type View = "overall" | string; // "overall" or propertyId
type Section = "liquidations" | "reservations" | "expenses" | "tasks" | "contract" | "contact";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function initials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function monthsLeft(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

/* ─── Status configs ──────────────────────────────────────────────────── */
const LIQ_STATUS: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  PAID:    { label: "Pagada",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  PENDING: { label: "Pendiente", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50"   },
  SENT:    { label: "Enviada",   dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50"    },
  OVERDUE: { label: "Vencida",   dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50"    },
};
const RES_STATUS: Record<string, { label: string; dot: string }> = {
  CONFIRMED:  { label: "Confirmada", dot: "bg-blue-500"    },
  IN_PROGRESS:{ label: "En curso",   dot: "bg-emerald-500" },
  COMPLETED:  { label: "Completada", dot: "bg-slate-400"   },
  CANCELLED:  { label: "Cancelada",  dot: "bg-rose-400"    },
};
const EXPENSE_LABEL: Record<string, string> = {
  CLEANING: "Limpieza", LAUNDRY: "Lavandería", SUPPLIES: "Insumos",
  REPAIR: "Reparación", UTILITY: "Servicios", MAINTENANCE: "Mantenimiento", OTHER: "Otro",
};
const TASK_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Pendiente",  color: "text-amber-600" },
  IN_PROGRESS: { label: "En proceso", color: "text-blue-600"  },
  COMPLETED:   { label: "Completada", color: "text-emerald-600" },
  CANCELLED:   { label: "Cancelada",  color: "text-slate-400" },
};
const PLATFORM_LABEL: Record<string, string> = {
  AIRBNB: "Airbnb", BOOKING: "Booking.com", DIRECT: "Directo", OTHER: "Otro",
};

/* ─── Micro components ────────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const s = LIQ_STATUS[status];
  if (!s) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">{children}</h3>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-stone-400">
      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-3">
        <FileText className="h-5 w-5 text-stone-300" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">{label}</p>
      <p className={cn("text-2xl font-bold tracking-tight", accent ? "text-emerald-600" : "text-stone-900")}>{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Liquidation Card ────────────────────────────────────────────────── */
function LiquidationCard({ liq, propName, propColor }: {
  liq: Liquidation; propName: string; propColor?: string;
}) {
  const s = LIQ_STATUS[liq.status];
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: propColor ?? "#e5e7eb" }} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">{propName}</p>
            <p className="text-base font-bold text-stone-800 mt-0.5">{liq.periodLabel}</p>
          </div>
          <StatusPill status={liq.status} />
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm border-t border-stone-100 pt-4">
          <div className="flex justify-between text-stone-500">
            <span>Ingreso bruto</span>
            <span className="font-medium text-stone-700">{formatARS(liq.grossRevenue)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Comisión Gesting</span>
            <span className="font-medium text-rose-500">− {formatARS(liq.commissionAmount)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Gastos operativos</span>
            <span className="font-medium text-rose-500">− {formatARS(liq.totalExpenses)}</span>
          </div>
        </div>

        {/* Net */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-stone-400 uppercase tracking-wide font-semibold">Neto a cobrar</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight mt-0.5">{formatARS(liq.netToOwner)}</p>
          </div>
          {(liq as any).invoiceUrl ? (
            <a
              href={(liq as any).invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl"
            >
              <FileText className="h-3.5 w-3.5" />
              Ver factura
            </a>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl">
              <FileText className="h-3.5 w-3.5" />
              Sin factura
            </span>
          )}
        </div>

        <p className="text-xs text-stone-400 mt-3">Vence: {formatDate(liq.dueDate)}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   OVERALL VIEW
══════════════════════════════════════════════════════════════════════ */
function OverallView({
  owner, properties, reservations, liquidations, expenses, tasks, onSelectProperty,
}: Props & { onSelectProperty: (id: string) => void }) {
  const totalPending = liquidations
    .filter((l) => l.status === "PENDING" || l.status === "OVERDUE")
    .reduce((s, l) => s + l.netToOwner, 0);

  const lastLiquidation = useMemo(() =>
    [...liquidations].sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)[0],
    [liquidations]
  );

  const thisMonthRes = reservations.filter((r) => {
    const d = new Date(r.checkIn);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.status !== "CANCELLED";
  });

  const totalGross = liquidations.reduce((s, l) => s + l.grossRevenue, 0);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Resumen general</p>
        <h2 className="text-xl font-bold text-stone-800">
          {properties.length === 1 ? properties[0].name : `${properties.length} propiedades`}
        </h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Saldo pendiente" value={formatARS(totalPending)} sub="Por cobrar" accent />
        <KpiCard label="Último neto" value={lastLiquidation ? formatARS(lastLiquidation.netToOwner) : "—"} sub={lastLiquidation?.periodLabel} />
        <KpiCard label="Reservas del mes" value={String(thisMonthRes.length)} sub="confirmadas y en curso" />
        <KpiCard label="Ingresos totales" value={formatARS(totalGross)} sub="historial completo" />
      </div>

      {/* Properties */}
      {properties.length > 1 && (
        <div>
          <SectionTitle>Sus propiedades</SectionTitle>
          <div className="space-y-3">
            {properties.map((p) => {
              const propLiqs = liquidations.filter((l) => l.propertyId === p.id);
              const propRes  = reservations.filter((r) => r.propertyId === p.id && r.status !== "CANCELLED");
              const pending  = propLiqs.filter((l) => l.status === "PENDING" || l.status === "OVERDUE").reduce((s, l) => s + l.netToOwner, 0);
              const lastLiq  = [...propLiqs].sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)[0];

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProperty(p.id)}
                  className="w-full text-left bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="h-1 w-full" style={{ backgroundColor: p.colorTag }} />
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: p.colorTag + "22" }}
                    >
                      <Home className="h-5 w-5" style={{ color: p.colorTag }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 truncate">{p.name}</p>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{p.address}, {p.city}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        <span>{propRes.length} reservas</span>
                        {pending > 0 && <span className="text-amber-600 font-semibold">{formatARS(pending)} pendiente</span>}
                        {lastLiq && <span>{formatARS(lastLiq.netToOwner)} último neto</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent liquidations overall */}
      <div>
        <SectionTitle>Últimas liquidaciones</SectionTitle>
        {liquidations.length === 0
          ? <EmptyState message="Sin liquidaciones registradas" />
          : [...liquidations]
              .sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)
              .slice(0, 3)
              .map((liq) => {
                const prop = properties.find((p) => p.id === liq.propertyId);
                return (
                  <LiquidationCard
                    key={liq.id}
                    liq={liq}
                    propName={prop?.name ?? "—"}
                    propColor={prop?.colorTag}
                  />
                );
              })
              .reduce((acc: React.ReactNode[], el, i) => [...acc, i > 0 ? <div key={`sp-${i}`} className="h-3" /> : null, el], [])
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PROPERTY VIEW
══════════════════════════════════════════════════════════════════════ */
function PropertyView({
  property: p, contracts, reservations, liquidations, expenses, tasks, onBack,
}: {
  property: Property;
  contracts: ManagementContract[];
  reservations: Reservation[];
  liquidations: Liquidation[];
  expenses: Expense[];
  tasks: Task[];
  onBack: () => void;
}) {
  const [section, setSection] = useState<Section>("liquidations");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const propRes  = reservations.filter((r) => r.propertyId === p.id);
  const propLiqs = liquidations.filter((l) => l.propertyId === p.id);
  const propExp  = expenses.filter((e) => e.propertyId === p.id);
  const propTasks = tasks.filter((t) => t.propertyId === p.id);
  const propContracts = contracts.filter((c) => c.propertyId === p.id);
  const activeContract = propContracts.find((c) => c.status === "ACTIVE" || c.status === "EXPIRING_SOON");

  const pending = propLiqs
    .filter((l) => l.status === "PENDING" || l.status === "OVERDUE")
    .reduce((s, l) => s + l.netToOwner, 0);
  const lastLiq = [...propLiqs].sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)[0];
  const activeRes = propRes.filter((r) => r.status === "IN_PROGRESS" || r.status === "CONFIRMED");

  const sections: { id: Section; label: string; count?: number }[] = [
    { id: "liquidations", label: "Liquidaciones", count: propLiqs.length },
    { id: "reservations", label: "Reservas",      count: propRes.length  },
    { id: "expenses",     label: "Gastos",         count: propExp.length  },
    { id: "tasks",        label: "Mantenimiento",  count: propTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length },
    { id: "contract",     label: "Contrato"                               },
    { id: "contact",      label: "Contacto"                               },
  ];

  return (
    <div className="space-y-6">
      {/* Property header */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: p.colorTag }} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: p.colorTag + "22" }}
            >
              <Home className="h-6 w-6" style={{ color: p.colorTag }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-stone-800 leading-tight">{p.name}</h2>
              <p className="text-sm text-stone-400 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{p.address}, {p.city}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.bedrooms} hab.</span>
                <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms} baño{p.bathrooms > 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p.maxGuests} huésp.</span>
              </div>
            </div>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-stone-100">
            <div className="text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-semibold">Pendiente</p>
              <p className="text-base font-bold text-amber-600 mt-0.5">{formatARS(pending)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-semibold">Último neto</p>
              <p className="text-base font-bold text-stone-800 mt-0.5">{lastLiq ? formatARS(lastLiq.netToOwner) : "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-semibold">Reservas</p>
              <p className="text-base font-bold text-stone-800 mt-0.5">{activeRes.length} activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              section === s.id
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300"
            )}
          >
            {s.label}
            {s.count !== undefined && s.count > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold",
                section === s.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
              )}>
                {s.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {section === "liquidations" && (
        <div className="space-y-3">
          <SectionTitle>Liquidaciones</SectionTitle>
          {propLiqs.length === 0
            ? <EmptyState message="Sin liquidaciones para esta propiedad" />
            : [...propLiqs]
                .sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)
                .map((liq) => (
                  <LiquidationCard key={liq.id} liq={liq} propName={p.name} propColor={p.colorTag} />
                ))
          }
        </div>
      )}

      {section === "reservations" && (
        <div className="space-y-3">
          <SectionTitle>Reservas</SectionTitle>
          {propRes.length === 0
            ? <EmptyState message="Sin reservas para esta propiedad" />
            : [...propRes]
                .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                .map((r) => {
                  const rs = RES_STATUS[r.status];
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", rs.dot)} />
                            <span className="text-xs font-semibold text-stone-500">{rs.label}</span>
                            <span className="text-xs text-stone-400">· {PLATFORM_LABEL[r.platform] ?? r.platform}</span>
                          </div>
                          <p className="text-sm font-semibold text-stone-800">
                            {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">{r.nights} noches</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-stone-400 uppercase font-semibold">Bruto</p>
                          <p className="text-base font-bold text-stone-800">{formatARS(r.grossAmount)}</p>
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5">Neto {formatARS(r.netAmount)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
          }
        </div>
      )}

      {section === "expenses" && (
        <div className="space-y-3">
          <SectionTitle>Gastos operativos</SectionTitle>
          {propExp.length === 0
            ? <EmptyState message="Sin gastos registrados" />
            : propExp.map((exp) => (
                <div key={exp.id} className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-stone-100 text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                          {EXPENSE_LABEL[exp.category] ?? exp.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-stone-800">{exp.description}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDate(exp.date)}</p>
                    </div>
                    <p className="text-base font-bold text-stone-800 shrink-0">{formatARS(exp.amount)}</p>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {section === "tasks" && (
        <div className="space-y-3">
          <SectionTitle>Mantenimiento</SectionTitle>
          {propTasks.length === 0
            ? <EmptyState message="Sin tareas registradas" />
            : propTasks.map((t) => {
                const ts = TASK_STATUS[t.status];
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold mb-1", ts.color)}>{ts.label}</p>
                        <p className="text-sm font-semibold text-stone-800">{t.title}</p>
                        {t.description && <p className="text-xs text-stone-400 mt-1">{t.description}</p>}
                        <p className="text-xs text-stone-400 mt-1.5">{formatDate(t.scheduledDate)}{t.provider ? ` · ${t.provider}` : ""}</p>
                      </div>
                      {(t.actualCost ?? t.estimatedCost) && (
                        <p className="text-sm font-bold text-stone-700 shrink-0">{formatARS(t.actualCost ?? t.estimatedCost ?? 0)}</p>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {section === "contract" && (
        <div className="space-y-3">
          <SectionTitle>Contrato de gestión</SectionTitle>
          {!activeContract
            ? <EmptyState message="Sin contrato activo para esta propiedad" />
            : (
              <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: p.colorTag }} />
                <div className="p-5 space-y-5">
                  {/* Contract status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">N° {activeContract.contractNumber}</p>
                      <p className="text-base font-bold text-stone-800 mt-0.5">
                        {activeContract.status === "ACTIVE" ? "Contrato vigente" : "Por vencer pronto"}
                      </p>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      activeContract.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", activeContract.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500")} />
                      {activeContract.status === "ACTIVE" ? "Vigente" : "Por vencer"}
                    </span>
                  </div>

                  {/* Contract details */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-stone-100 pt-4">
                    {[
                      { label: "Inicio", value: formatDate(activeContract.startDate) },
                      { label: "Vencimiento", value: formatDate(activeContract.endDate) },
                      { label: "Comisión", value: `${activeContract.commissionRate}%` },
                      { label: "Meses restantes", value: `${monthsLeft(activeContract.endDate)} meses` },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="text-[11px] text-stone-400 uppercase tracking-wide font-semibold">{row.label}</p>
                        <p className="font-semibold text-stone-800 mt-0.5">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                      <Download className="h-4 w-4" />PDF
                    </button>
                    {!activeContract.signedAt && !signed ? (
                      <button
                        onClick={async () => { setSigning(true); await new Promise(r => setTimeout(r, 900)); setSigning(false); setSigned(true); }}
                        disabled={signing}
                        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60"
                      >
                        {signing
                          ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Firmando...</>
                          : <><PenLine className="h-4 w-4" />Firmar</>
                        }
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        {activeContract.signedAt ? `Firmado ${formatDate(activeContract.signedAt)}` : "Firmado"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        </div>
      )}

      {section === "contact" && (
        <div className="space-y-3">
          <SectionTitle>Contacto</SectionTitle>
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] divide-y divide-stone-100">
            {[
              { icon: Building2, label: "Administradora", value: "Gesting SRL" },
              { icon: Phone,     label: "Teléfono",       value: "+54 11 4567-8900" },
              { icon: Mail,      label: "Email",           value: "info@gesting.com.ar" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wide font-semibold">{item.label}</p>
                  <p className="text-sm font-semibold text-stone-800 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════════════════════ */
function PortalHeader({
  owner, view, properties, onSelectView,
}: {
  owner: Owner;
  view: View;
  properties: Property[];
  onSelectView: (v: View) => void;
}) {
  const currentProp = properties.find((p) => p.id === view);

  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          {/* Logo + brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-stone-800 tracking-tight">Gesting</span>
            <span className="text-stone-300 text-xs font-light">|</span>
            <span className="text-xs text-stone-400 font-medium">Portal propietario</span>
          </div>

          {/* Owner avatar */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-stone-700">{owner.firstName} {owner.lastName}</p>
              <p className="text-[10px] text-stone-400">{owner.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials(owner.firstName, owner.lastName)}
            </div>
          </div>
        </div>

        {/* Property switcher — only when multiple properties */}
        {properties.length > 1 && (
          <div className="flex items-center gap-1.5 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => onSelectView("overall")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                view === "overall"
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              General
            </button>
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectView(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  view === p.id
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: view === p.id ? "white" : p.colorTag }}
                />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb for single property or in property view */}
        {properties.length === 1 && view !== "overall" && (
          <div className="flex items-center gap-1.5 pb-3 text-xs text-stone-500">
            <Home className="h-3 w-3" />{properties[0].name}
          </div>
        )}
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════════ */
export function OwnerPortalClient(props: Props) {
  const { owner, properties, hideHeader } = props;
  const [view, setView] = useState<View>(properties.length === 1 ? properties[0].id : "overall");

  const currentProp = properties.find((p) => p.id === view);

  return (
    <div className={hideHeader ? undefined : "min-h-screen"} style={hideHeader ? undefined : { backgroundColor: "#f7f6f3" }}>
      {!hideHeader && (
        <PortalHeader
          owner={owner}
          view={view}
          properties={properties}
          onSelectView={setView}
        />
      )}

      <main className="max-w-2xl mx-auto px-4 py-7 pb-16">
        {/* Property switcher when header is hidden (authenticated portal) */}
        {hideHeader && properties.length > 1 && (
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setView("overall")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                view === "overall" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />General
            </button>
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => setView(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  view === p.id ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                )}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: view === p.id ? "white" : p.colorTag }} />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Back button when in property detail and multiple properties */}
        {view !== "overall" && properties.length > 1 && (
          <button
            onClick={() => setView("overall")}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al resumen general
          </button>
        )}

        {view === "overall" ? (
          <OverallView {...props} onSelectProperty={setView} />
        ) : currentProp ? (
          <PropertyView
            property={currentProp}
            contracts={props.contracts}
            reservations={props.reservations}
            liquidations={props.liquidations}
            expenses={props.expenses}
            tasks={props.tasks}
            onBack={() => setView("overall")}
          />
        ) : null}

        <p className="text-center text-[11px] text-stone-400 mt-12">
          Gesting PMS · Portal de propietarios · Solo lectura
        </p>
      </main>
    </div>
  );
}
