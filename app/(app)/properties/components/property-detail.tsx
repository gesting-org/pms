"use client";

import Link from "next/link";
import {
  Property, Owner, Reservation, Task, Expense,
  Liquidation, ManagementContract, Guest,
} from "@/lib/mock/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Pencil, MapPin, Bed, Bath, Users, Percent, Building2,
  Phone, Mail, CreditCard, FileText, CalendarDays,
  Receipt, CheckSquare, DollarSign, ExternalLink, Plus,
  ChevronRight, Wifi, Star,
} from "lucide-react";

type ReservationWithGuest = Reservation & { guest: Guest };

const PLATFORM_ICONS: Record<string, string> = {
  AIRBNB: "🏠", BOOKING: "🅱️", DIRECT: "📱", OTHER: "🔗",
};
const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb", BOOKING: "Booking.com", DIRECT: "Directo", OTHER: "Otro",
};

const STATUS_PILL: Record<string, { pill: string; label: string }> = {
  ACTIVE:       { pill: "pill-active",   label: "Activa"        },
  MAINTENANCE:  { pill: "pill-warning",  label: "Mantenimiento" },
  PAUSED:       { pill: "pill-inactive", label: "Pausada"       },
  INACTIVE:     { pill: "pill-danger",   label: "Inactiva"      },
  CONFIRMED:    { pill: "pill-info",     label: "Confirmada"    },
  IN_PROGRESS:  { pill: "pill-active",   label: "En curso"      },
  COMPLETED:    { pill: "pill-inactive", label: "Completada"    },
  CANCELLED:    { pill: "pill-danger",   label: "Cancelada"     },
  PENDING:      { pill: "pill-info",     label: "Pendiente"     },
  SENT:         { pill: "pill-warning",  label: "Enviada"       },
  PAID:         { pill: "pill-active",   label: "Pagada"        },
  OVERDUE:      { pill: "pill-danger",   label: "Mora"          },
  DRAFT:        { pill: "pill-draft",    label: "Borrador"      },
  EXPIRING_SOON:{ pill: "pill-warning",  label: "Por vencer"    },
  EXPIRED:      { pill: "pill-danger",   label: "Vencido"       },
  TERMINATED:   { pill: "pill-inactive", label: "Rescindido"    },
  IN_PROGRESS_TASK: { pill: "pill-info", label: "En curso"      },
};

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

interface PropertyDetailProps {
  property: Property;
  owner: Owner;
  reservations: ReservationWithGuest[];
  tasks: Task[];
  expenses: Expense[];
  liquidations: Liquidation[];
  contract?: ManagementContract;
}

export function PropertyDetail({
  property: p, owner, reservations, tasks, expenses, liquidations, contract,
}: PropertyDetailProps) {
  const activePlatforms   = p.platforms.filter((pl) => pl.isActive);
  const openTasks         = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const pendingExpenses   = expenses.filter((e) => e.status === "ADVANCED_BY_GESTING");
  const pendingExpTotal   = pendingExpenses.reduce((s, e) => s + e.amount, 0);
  const pStatus           = STATUS_PILL[p.status];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: p.colorTag }} />
            <div>
              <h2 className="text-lg font-bold text-foreground">{p.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {p.address}, {p.city}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("pill text-[11px]", pStatus.pill)}>{pStatus.label}</span>
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/properties/${p.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />Editar
            </Link>
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          {[
            { label: "Habitaciones", value: `${p.bedrooms} hab.`,                      Icon: Bed     },
            { label: "Baños",        value: `${p.bathrooms} baño${p.bathrooms !== 1 ? "s" : ""}`, Icon: Bath },
            { label: "Huéspedes",    value: `${p.maxGuests} máx.`,                     Icon: Users   },
            { label: "Comisión",     value: `${p.commissionRate}%`,                    Icon: Percent },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex sm:inline-flex overflow-x-auto">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="reservations">
            Reservas
            {reservations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {reservations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="financials">Finanzas</TabsTrigger>
          <TabsTrigger value="tasks">
            Tareas
            {openTasks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                {openTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="owner">Propietario</TabsTrigger>
        </TabsList>

        {/* ── RESUMEN ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Descripción */}
            {p.description && (
              <div className="sm:col-span-2 bg-white rounded-xl border border-border shadow-xs p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descripción</p>
                <p className="text-sm text-foreground leading-relaxed">{p.description}</p>
              </div>
            )}

            {/* Amenities */}
            <div className="bg-white rounded-xl border border-border shadow-xs p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amenities</p>
              {p.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin amenities</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {p.amenities.map((a) => (
                    <span key={a} className="px-2 py-1 rounded-full bg-muted text-xs font-medium">{a}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Plataformas */}
            <div className="bg-white rounded-xl border border-border shadow-xs p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plataformas activas</p>
              {activePlatforms.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin plataformas</p>
              ) : (
                <div className="space-y-2">
                  {activePlatforms.map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {PLATFORM_ICONS[pl.platform]} {PLATFORM_LABELS[pl.platform]}
                      </span>
                      {pl.listingUrl ? (
                        <a href={pl.listingUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1">
                          Ver listing <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin URL</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tarifas */}
            <div className="bg-white rounded-xl border border-border shadow-xs p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tarifas</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa/noche</span>
                  <span className="font-semibold text-primary">{formatARS(p.nightlyRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limpieza</span>
                  <span className="font-medium">{formatARS(p.cleaningFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión Gesting</span>
                  <span className="font-medium">{p.commissionRate}%</span>
                </div>
              </div>
            </div>

            {/* Contrato */}
            <div className="bg-white rounded-xl border border-border shadow-xs p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contrato de gestión</p>
              {contract ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{contract.contractNumber}</span>
                    <span className={cn("pill text-[10px]", STATUS_PILL[contract.status]?.pill ?? "pill-info")}>
                      {STATUS_PILL[contract.status]?.label ?? contract.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    <Link href={`/contracts/${contract.id}`}>
                      <FileText className="h-3 w-3" />Ver contrato
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sin contrato activo</p>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href={`/contracts/new?propertyId=${p.id}`}>
                      <Plus className="h-3 w-3" />Generar contrato
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── RESERVAS ── */}
        <TabsContent value="reservations" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{reservations.length} reservas</p>
            <Button asChild size="sm">
              <Link href={`/reservations/new?propertyId=${p.id}`}>
                <Plus className="h-3.5 w-3.5" />Nueva reserva
              </Link>
            </Button>
          </div>
          {reservations.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">Sin reservas</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {reservations.map((r) => (
                <Link key={r.id} href={`/reservations/${r.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_14%_98%)] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {r.guest.firstName} {r.guest.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.checkIn)} → {formatDate(r.checkOut)} · {r.nights} noches · {PLATFORM_LABELS[r.platform]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatARS(r.grossAmount)}</p>
                    <span className={cn("pill text-[10px]", STATUS_PILL[r.status]?.pill)}>
                      {STATUS_PILL[r.status]?.label}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── FINANZAS ── */}
        <TabsContent value="financials" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Ingresos totales",  value: formatARS(reservations.filter(r => r.status !== "CANCELLED").reduce((s, r) => s + r.grossAmount, 0)), color: "text-primary" },
              { label: "Comisiones",        value: formatARS(reservations.filter(r => r.status !== "CANCELLED").reduce((s, r) => s + r.commissionAmount, 0)), color: "text-foreground" },
              { label: "Gastos pendientes", value: formatARS(pendingExpTotal), color: pendingExpTotal > 0 ? "text-amber-600" : "text-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-border shadow-xs p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-lg font-bold mt-1", color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{liquidations.length} liquidaciones</p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/liquidations?propertyId=${p.id}`}>Ver todas</Link>
            </Button>
          </div>
          {liquidations.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-12 text-muted-foreground">
              <DollarSign className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">Sin liquidaciones</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {liquidations.map((l) => (
                <Link key={l.id} href={`/liquidations/${l.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_14%_98%)] transition-colors group">
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{l.periodLabel}</p>
                    <p className="text-xs text-muted-foreground">{l.reservationIds.length} reservas · Vence {formatDate(l.dueDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatARS(l.netToOwner)}</p>
                    <span className={cn("pill text-[10px]", STATUS_PILL[l.status]?.pill)}>
                      {STATUS_PILL[l.status]?.label}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAREAS ── */}
        <TabsContent value="tasks" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{tasks.length} tareas · {openTasks.length} abiertas</p>
            <Button asChild size="sm">
              <Link href={`/tasks/new?propertyId=${p.id}`}>
                <Plus className="h-3.5 w-3.5" />Nueva tarea
              </Link>
            </Button>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckSquare className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">Sin tareas</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", t.status === "COMPLETED" && "line-through text-muted-foreground")}>
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.type} · {formatDate(t.scheduledDate)}{t.provider && ` · ${t.provider}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {t.estimatedCost != null && (
                      <p className="text-xs text-muted-foreground">{formatARS(t.estimatedCost)}</p>
                    )}
                    <span className={cn("pill text-[10px]",
                      t.priority === "URGENT" ? "pill-danger" :
                      t.priority === "HIGH"   ? "pill-warning" : "pill-info"
                    )}>
                      {t.priority === "URGENT" ? "Urgente" : t.priority === "HIGH" ? "Alta" : t.priority === "MEDIUM" ? "Media" : "Baja"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── PROPIETARIO ── */}
        <TabsContent value="owner">
          <div className="bg-white rounded-xl border border-border shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{owner.firstName} {owner.lastName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">DNI {owner.dni}{owner.cuit && ` · CUIT ${owner.cuit}`}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/owners/${owner.id}`}>
                  <Building2 className="h-3.5 w-3.5" />Ver perfil
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border text-sm">
              {owner.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">{owner.email}</span>
                </div>
              )}
              {owner.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">{owner.phone}</span>
                </div>
              )}
              {owner.bankAlias && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">{owner.bankName} · {owner.bankAlias}</span>
                </div>
              )}
            </div>
            {p.notes && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Notas</p>
                <p className="text-sm text-foreground">{p.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
