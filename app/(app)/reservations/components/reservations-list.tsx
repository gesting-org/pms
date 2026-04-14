"use client";

import { useState } from "react";
import Link from "next/link";
import { Reservation, Property, Guest, ReservationStatus, Platform } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatARS, RESERVATION_STATUS_LABELS, PLATFORM_LABELS, cn } from "@/lib/utils";
import { Plus, Search, CalendarDays, ChevronRight } from "lucide-react";

type ResWithRefs = Reservation & { property: Property; guest: Guest };

const STATUS_BADGE: Record<string, any> = {
  CONFIRMED: "info", IN_PROGRESS: "success", COMPLETED: "secondary", CANCELLED: "destructive",
};
const STATUS_DOT: Record<string, string> = {
  CONFIRMED: "bg-blue-500", IN_PROGRESS: "bg-emerald-500",
  COMPLETED: "bg-slate-400", CANCELLED: "bg-red-400",
};
const PLATFORM_EMOJI: Record<string, string> = {
  AIRBNB: "🏠", BOOKING: "🅱️", DIRECT: "📱", OTHER: "🔗",
};

export function ReservationsList({ reservations }: { reservations: ResWithRefs[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  const filtered = reservations.filter((r) => {
    const guestName = `${r.guest.firstName} ${r.guest.lastName}`.toLowerCase();
    const matchSearch = !search || guestName.includes(search.toLowerCase()) ||
      r.property.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchPlatform = platformFilter === "ALL" || r.platform === platformFilter;
    return matchSearch && matchStatus && matchPlatform;
  });

  // Stats
  const stats = {
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
    IN_PROGRESS: reservations.filter((r) => r.status === "IN_PROGRESS").length,
    COMPLETED: reservations.filter((r) => r.status === "COMPLETED").length,
    CANCELLED: reservations.filter((r) => r.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Huésped, propiedad..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
              <SelectItem value="IN_PROGRESS">En curso</SelectItem>
              <SelectItem value="COMPLETED">Completadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Plataformas</SelectItem>
              <SelectItem value="AIRBNB">Airbnb</SelectItem>
              <SelectItem value="BOOKING">Booking</SelectItem>
              <SelectItem value="DIRECT">Directo</SelectItem>
              <SelectItem value="OTHER">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/reservations/new"><Plus className="h-4 w-4" />Nueva reserva</Link>
        </Button>
      </div>

      {/* Status pills */}
      <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
        {Object.entries(stats).map(([s, n]) => n > 0 && (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", STATUS_DOT[s])} />
            {n} {RESERVATION_STATUS_LABELS[s].toLowerCase()}
          </span>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin reservas</p>
          <p className="text-sm mt-1">{search || statusFilter !== "ALL" ? "Probá con otros filtros" : "Cargá la primera reserva"}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
            <span>Propiedad</span>
            <span>Huésped</span>
            <span>Check-in</span>
            <span>Check-out</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Estado</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/reservations/${r.id}`}
                className="group flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-1 sm:gap-4 sm:items-center px-4 py-3 hover:bg-accent/40 transition-colors"
              >
                {/* Propiedad */}
                <div className="flex items-center gap-2 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.property.colorTag }} />
                  <span className="text-xs font-medium truncate max-w-[120px]">{r.property.name}</span>
                </div>
                {/* Huésped */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {r.guest.firstName} {r.guest.lastName}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {PLATFORM_EMOJI[r.platform]} {PLATFORM_LABELS[r.platform]}
                  </span>
                </div>
                {/* Fechas */}
                <span className="text-xs text-muted-foreground">{formatDate(r.checkIn)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(r.checkOut)} <span className="text-[10px]">({r.nights}n)</span></span>
                {/* Monto */}
                <span className="text-sm font-semibold text-right">{formatARS(r.grossAmount)}</span>
                {/* Estado */}
                <div className="flex items-center justify-end gap-1.5">
                  <Badge variant={STATUS_BADGE[r.status]} className="text-[10px]">
                    {RESERVATION_STATUS_LABELS[r.status]}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
