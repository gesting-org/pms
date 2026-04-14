"use client";

import { useState } from "react";
import Link from "next/link";
import { Property, Owner, PropertyStatus } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, Building2, ChevronRight, Bed, Bath, Users, Wifi } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

type PropertyWithOwner = Property & { owner: Owner };

const PLATFORM_ICONS: Record<string, string> = {
  AIRBNB: "🏠", BOOKING: "🅱️", DIRECT: "📱", OTHER: "🔗",
};
const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb", BOOKING: "Booking", DIRECT: "Directo", OTHER: "Otro",
};

const STATUS_STYLE: Record<PropertyStatus, { dot: string; pill: string; label: string }> = {
  ACTIVE:       { dot: "bg-emerald-500", pill: "pill-active",   label: "Activa"          },
  MAINTENANCE:  { dot: "bg-amber-500",   pill: "pill-warning",  label: "Mantenimiento"   },
  PAUSED:       { dot: "bg-slate-400",   pill: "pill-inactive", label: "Pausada"         },
  INACTIVE:     { dot: "bg-red-400",     pill: "pill-danger",   label: "Inactiva"        },
};

const STATUS_FILTERS = [
  { value: "TODAS",       label: "Todas"         },
  { value: "ACTIVE",      label: "Activas"       },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "PAUSED",      label: "Pausadas"      },
];

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function PropertiesList({ properties }: { properties: PropertyWithOwner[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("TODAS");

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      `${p.owner.firstName} ${p.owner.lastName}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "TODAS" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: string) => properties.filter((p) => p.status === s).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/properties/new">
            <Plus className="h-4 w-4" />
            Nueva propiedad
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => {
          const count = value === "TODAS" ? properties.length : countByStatus(value);
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {label}
              <span className={cn(
                "inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4",
                active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="h-10 w-10 opacity-20 mb-3" />
          <p className="text-sm font-medium">Sin resultados</p>
          <p className="text-xs mt-1">
            {search || statusFilter !== "TODAS" ? "Probá con otros filtros" : "Registrá la primera propiedad"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {properties.length} propiedad{properties.length !== 1 ? "es" : ""}
      </p>
    </div>
  );
}

function PropertyCard({ property: p }: { property: PropertyWithOwner }) {
  const activePlatforms = p.platforms.filter((pl) => pl.isActive);
  const style = STATUS_STYLE[p.status];
  const activeRes = (p as any).activeReservation ?? null;
  const nextRes   = (p as any).nextReservation ?? null;
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow();

  return (
    <Link
      ref={ref}
      href={`/properties/${p.id}`}
      className="group block rounded-xl border border-border bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div aria-hidden style={glowStyle} />
      {/* Color strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: p.colorTag }} />

      <div className="p-4 space-y-3">
        {/* Nombre y estado */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {p.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{p.address}, {p.city}</p>
          </div>
          <span className={cn("pill text-[10px] shrink-0", style.pill)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            {style.label}
          </span>
        </div>

        {/* Características */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />{p.bedrooms} hab.
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />{p.bathrooms} baño{p.bathrooms > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />{p.maxGuests} huésp.
          </span>
          {p.amenities.some((a) => a.toLowerCase().includes("wifi")) && (
            <Wifi className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Reserva activa / próxima */}
        {activeRes && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] text-emerald-700 font-medium truncate">
              Ocupada hasta {activeRes.checkOut.split("-").reverse().join("/")}
            </span>
          </div>
        )}
        {!activeRes && nextRes && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span className="text-[10px] text-blue-700 font-medium truncate">
              Próx. check-in {nextRes.checkIn.split("-").reverse().join("/")}
            </span>
          </div>
        )}

        <div className="border-t border-border" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Propietario</p>
            <p className="text-xs font-medium truncate">{p.owner.firstName} {p.owner.lastName}</p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-[10px] text-muted-foreground">Tarifa/noche</p>
            <p className="text-xs font-semibold text-primary">{formatARS(p.nightlyRate)}</p>
          </div>
        </div>

        {/* Plataformas */}
        {activePlatforms.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {activePlatforms.map((pl) => (
              <span
                key={pl.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
              >
                {PLATFORM_ICONS[pl.platform]} {PLATFORM_LABELS[pl.platform]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <span className="text-xs text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalle <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
