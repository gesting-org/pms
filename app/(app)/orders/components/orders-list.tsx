"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatARS, cn } from "@/lib/utils";
import {
  Search, ShoppingBag, Package, ChevronRight,
  CalendarDays, Hash, StickyNote, AlertTriangle,
  Clock, CheckCircle2, Archive,
} from "lucide-react";
import type { GuestOrderRow } from "@/app/api/orders/route";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  );
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatCheckin(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Days from today until check-in (negative = already passed) */
function daysUntilCheckin(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ci = parseLocalDate(dateStr);
  return Math.round((ci.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── urgency logic ────────────────────────────────────────────────────────────

type Urgency = "overdue" | "today" | "soon" | "upcoming" | "future";

interface UrgencyConfig {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badgeClass: string;
  headerClass: string;
  borderClass: string;
  dotClass: string;
}

const URGENCY_CONFIG: Record<Urgency, UrgencyConfig> = {
  overdue: {
    label: "Check-in vencido",
    sublabel: "El check-in ya pasó",
    icon: Archive,
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    headerClass: "text-slate-500",
    borderClass: "border-l-slate-400",
    dotClass: "bg-slate-400",
  },
  today: {
    label: "Hoy",
    sublabel: "Check-in hoy",
    icon: AlertTriangle,
    badgeClass: "bg-red-50 text-red-600 border-red-200",
    headerClass: "text-red-600",
    borderClass: "border-l-red-500",
    dotClass: "bg-red-500 animate-pulse",
  },
  soon: {
    label: "Próximos 3 días",
    sublabel: "Check-in en 1–3 días",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-600 border-amber-200",
    headerClass: "text-amber-600",
    borderClass: "border-l-amber-400",
    dotClass: "bg-amber-400",
  },
  upcoming: {
    label: "Esta semana",
    sublabel: "Check-in en 4–7 días",
    icon: CalendarDays,
    badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
    headerClass: "text-blue-600",
    borderClass: "border-l-blue-400",
    dotClass: "bg-blue-400",
  },
  future: {
    label: "Más adelante",
    sublabel: "Check-in en más de 7 días",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    headerClass: "text-emerald-600",
    borderClass: "border-l-emerald-400",
    dotClass: "bg-emerald-400",
  },
};

const URGENCY_ORDER: Urgency[] = ["today", "soon", "upcoming", "future", "overdue"];

function getUrgency(dateStr: string): Urgency {
  const days = daysUntilCheckin(dateStr);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 3) return "soon";
  if (days <= 7) return "upcoming";
  return "future";
}

function daysLabel(dateStr: string): string {
  const days = daysUntilCheckin(dateStr);
  if (days < 0) return `hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

// ─── card ────────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  urgency,
  onClick,
}: {
  order: GuestOrderRow;
  urgency: Urgency;
  onClick: () => void;
}) {
  const cfg = URGENCY_CONFIG[urgency];
  const days = daysUntilCheckin(order.checkinDate);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border border-border border-l-4 bg-card shadow-sm px-4 py-3.5",
        "hover:shadow-md hover:border-border/80 transition-all duration-200",
        cfg.borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{order.guestName}</span>
            <span className="font-mono text-[11px] text-primary font-bold tracking-widest bg-primary/8 px-1.5 py-0.5 rounded">
              {order.bookingCode}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="truncate">{order.propertyName}</span>
            <span className="shrink-0 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Check-in {formatCheckin(order.checkinDate)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
              cfg.badgeClass
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)} />
              {daysLabel(order.checkinDate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {itemCount} producto{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-base font-bold text-emerald-600">{formatARS(order.totalARS)}</span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(order.createdAt)}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity mt-0.5" />
        </div>
      </div>
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function OrdersList({ orders }: { orders: GuestOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GuestOrderRow | null>(null);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.guestName.toLowerCase().includes(q) ||
        o.propertyName.toLowerCase().includes(q) ||
        o.bookingCode.toLowerCase().includes(q)
    );
  }, [orders, search]);

  // Group by urgency, sort within each group by checkin asc
  const grouped = useMemo(() => {
    const map: Record<Urgency, GuestOrderRow[]> = {
      today: [], soon: [], upcoming: [], future: [], overdue: [],
    };
    for (const o of filtered) {
      map[getUrgency(o.checkinDate)].push(o);
    }
    // Sort each group by checkin date ascending
    for (const key of Object.keys(map) as Urgency[]) {
      map[key].sort((a, b) =>
        parseLocalDate(a.checkinDate).getTime() - parseLocalDate(b.checkinDate).getTime()
      );
    }
    return map;
  }, [filtered]);

  const totalRevenue = filtered.reduce((s, o) => s + o.totalARS, 0);
  const activeGroups = URGENCY_ORDER.filter((u) => grouped[u].length > 0);

  // Summary stats
  const stats = useMemo(() => ({
    today: grouped.today.length,
    soon: grouped.soon.length,
    overdue: grouped.overdue.length,
  }), [grouped]);

  return (
    <>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Huésped, propiedad, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {filtered.length > 0 && (
            <p className="text-sm text-muted-foreground shrink-0">
              <span className="font-semibold text-foreground">{formatARS(totalRevenue)}</span>
              {" "}en{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span>
              {" "}pedido{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Urgency summary chips */}
        {!search && (stats.today > 0 || stats.soon > 0 || stats.overdue > 0) && (
          <div className="flex gap-2 flex-wrap">
            {stats.today > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {stats.today} hoy
              </span>
            )}
            {stats.soon > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {stats.soon} próximos 3 días
              </span>
            )}
            {stats.overdue > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                <Archive className="h-3 w-3" />
                {stats.overdue} check-in vencido
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin pedidos</p>
            <p className="text-sm mt-1">
              {search
                ? "Probá con otros filtros"
                : "Los pedidos del sitio de huéspedes aparecerán aquí"}
            </p>
          </div>
        )}

        {/* Groups */}
        {activeGroups.map((urgency) => {
          const cfg = URGENCY_CONFIG[urgency];
          const Icon = cfg.icon;
          const group = grouped[urgency];
          return (
            <div key={urgency} className="space-y-2">
              {/* Group header */}
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4 shrink-0", cfg.headerClass)} />
                <h3 className={cn("text-sm font-semibold", cfg.headerClass)}>
                  {cfg.label}
                </h3>
                <span className="text-xs text-muted-foreground">— {cfg.sublabel}</span>
                <span className={cn(
                  "ml-auto text-xs font-medium px-2 py-0.5 rounded-full border",
                  cfg.badgeClass
                )}>
                  {group.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {group.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    urgency={urgency}
                    onClick={() => setSelected(order)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg w-full">
          {selected && (() => {
            const urgency = getUrgency(selected.checkinDate);
            const cfg = URGENCY_CONFIG[urgency];
            const itemCount = selected.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base flex items-center gap-2">
                    Detalle del pedido
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ml-1",
                      cfg.badgeClass
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)} />
                      {daysLabel(selected.checkinDate)}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-1">
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />Fecha del pedido
                      </p>
                      <p className="font-medium">{formatDateTime(selected.createdAt)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />Código de reserva
                      </p>
                      <p className="font-mono font-bold text-primary tracking-widest">{selected.bookingCode}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Huésped</p>
                      <p className="font-medium">{selected.guestName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Propiedad</p>
                      <p className="font-medium">{selected.propertyName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium">{formatCheckin(selected.checkinDate)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Productos</p>
                      <p className="font-medium">{itemCount} ítem{itemCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Items */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />Productos
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
                        <span>Producto</span>
                        <span className="text-center">Cant.</span>
                        <span className="text-right">P. unit.</span>
                        <span className="text-right">Subtotal</span>
                      </div>
                      <div className="divide-y divide-border">
                        {selected.items.map((item, i) => (
                          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2.5 items-center text-sm">
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-center text-muted-foreground">{item.quantity}</span>
                            <span className="text-right text-muted-foreground">{formatARS(item.unitPriceARS)}</span>
                            <span className="text-right font-medium">{formatARS(item.unitPriceARS * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selected.notes && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                        <StickyNote className="h-3.5 w-3.5" />Notas del huésped
                      </p>
                      <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2.5">
                        {selected.notes}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-emerald-600">{formatARS(selected.totalARS)}</span>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>
                    Cerrar
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
