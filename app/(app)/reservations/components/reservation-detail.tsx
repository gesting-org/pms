"use client";

import Link from "next/link";
import { Reservation, Property, Guest, Task } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatDate, formatARS, RESERVATION_STATUS_LABELS,
  PLATFORM_LABELS, TASK_TYPE_LABELS, PRIORITY_LABELS, cn,
} from "@/lib/utils";
import {
  ChevronLeft, MapPin, Mail, Phone, Globe, Calendar,
  DollarSign, Moon, Tag, ClipboardList, CheckSquare, Pencil, Copy,
} from "lucide-react";

const STATUS_BADGE: Record<string, any> = {
  CONFIRMED: "info", IN_PROGRESS: "success", COMPLETED: "secondary", CANCELLED: "destructive",
};
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "border-l-blue-500",
  IN_PROGRESS: "border-l-emerald-500",
  COMPLETED: "border-l-slate-400",
  CANCELLED: "border-l-red-400",
};

export function ReservationDetail({
  reservation: r, property, guest, tasks,
}: {
  reservation: Reservation; property: Property; guest: Guest; tasks: Task[];
}) {
  const netAmount = r.grossAmount - r.platformFee;
  const commission = netAmount * Number(property.commissionRate) / 100;

  return (
    <div className="space-y-4">
      <Link href="/reservations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a reservas
      </Link>

      {/* Header card */}
      <div className={cn("rounded-xl border-l-4 bg-card shadow-sm p-4", STATUS_COLORS[r.status])}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{guest.firstName} {guest.lastName}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <Link href={`/properties/${property.id}`} className="hover:text-primary transition-colors">
                {property.name}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={STATUS_BADGE[r.status]}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
            <Button size="sm" variant="outline">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fechas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />Estadía
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{formatDate(r.checkIn)}{r.checkInTime ? ` · ${r.checkInTime}hs` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{formatDate(r.checkOut)}{r.checkOutTime ? ` · ${r.checkOutTime}hs` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Moon className="h-3 w-3" />Noches</span>
              <span className="font-bold text-primary">{r.nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" />Plataforma</span>
              <span className="font-medium">{PLATFORM_LABELS[r.platform]}</span>
            </div>
            {r.externalId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID externo</span>
                <span className="font-mono text-xs">{r.externalId}</span>
              </div>
            )}
            {(r as any).bookingCode && (
              <div className="flex justify-between items-center pt-1 border-t mt-1">
                <span className="text-muted-foreground">Código de reserva</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm tracking-widest text-primary">
                    {(r as any).bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText((r as any).bookingCode)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar código"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Montos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />Finanzas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto bruto</span>
              <span className="font-medium">{formatARS(r.grossAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cargos plataforma</span>
              <span className="text-red-500">- {formatARS(r.platformFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto a liquidar</span>
              <span className="font-semibold">{formatARS(netAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Comisión Gesting ({property.commissionRate}%)</span>
              <span className="text-primary font-medium">{formatARS(commission)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Neto propietario</span>
              <span className="text-emerald-600">{formatARS(netAmount - commission)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Huésped */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Huésped</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{guest.firstName} {guest.lastName}</p>
            {guest.nationality && <p className="text-muted-foreground">{guest.nationality}</p>}
            {guest.email && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />{guest.email}
              </p>
            )}
            {guest.phone && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{guest.phone}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tareas asociadas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Sin tareas asociadas</p>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link href={`/tasks/new?reservationId=${r.id}&propertyId=${r.propertyId}`}>
                    Crear tarea de limpieza
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between hover:text-primary transition-colors">
                    <span className="text-sm">{t.title}</span>
                    <Badge variant={t.priority === "URGENT" ? "destructive" : t.priority === "HIGH" ? "warning" : "secondary"} className="text-[10px]">
                      {PRIORITY_LABELS[t.priority]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {r.notes && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{r.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
