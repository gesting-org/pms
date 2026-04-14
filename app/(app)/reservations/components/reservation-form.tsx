"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Property, Guest, Platform } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatARS, PLATFORM_LABELS, calculateNights, cn } from "@/lib/utils";
import { CalendarDays, User, DollarSign, ChevronLeft, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";

interface ReservationFormProps {
  properties: Property[];
  guests: Guest[];
  defaultPropertyId?: string;
}

export function ReservationForm({ properties, guests, defaultPropertyId }: ReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [guestSearch, setGuestSearch] = useState("");
  const [showGuestSearch, setShowGuestSearch] = useState(false);

  const [form, setForm] = useState({
    propertyId: defaultPropertyId ?? "",
    guestId: "",
    platform: "AIRBNB" as Platform,
    externalId: "",
    checkIn: "",
    checkInTime: "14:00",
    checkOut: "",
    checkOutTime: "10:00",
    grossAmount: "",
    platformFee: "",
    notes: "",
    paymentStatus: "PAID",
    // New guest mode
    newGuest: false,
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    guestNationality: "Argentina",
  });

  const nights = form.checkIn && form.checkOut
    ? calculateNights(form.checkIn, form.checkOut)
    : 0;

  const grossNum = parseFloat(form.grossAmount) || 0;
  const feeNum = parseFloat(form.platformFee) || 0;
  const netAmount = grossNum - feeNum;

  const selectedProperty = properties.find((p) => p.id === form.propertyId);

  const filteredGuests = guests.filter((g) =>
    `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(guestSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyId || (!form.guestId && !form.newGuest)) {
      toast({ title: "Campos requeridos", description: "Seleccioná propiedad y huésped.", variant: "destructive" });
      return;
    }
    if (!form.checkIn || !form.checkOut || nights <= 0) {
      toast({ title: "Fechas inválidas", description: "Verificá check-in y check-out.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: form.propertyId,
        guestId: form.guestId,
        platform: form.platform,
        externalId: form.externalId,
        checkIn: form.checkIn,
        checkInTime: form.checkInTime,
        checkOut: form.checkOut,
        checkOutTime: form.checkOutTime,
        nights,
        grossAmount: grossNum,
        platformFee: feeNum,
        netAmount,
        notes: form.notes,
        newGuest: form.newGuest,
        guestFirstName: form.guestFirstName,
        guestLastName: form.guestLastName,
        guestEmail: form.guestEmail,
        guestPhone: form.guestPhone,
        guestNationality: form.guestNationality,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast({ title: "Error al guardar", description: json.error, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: "Reserva creada correctamente" });
    router.push("/reservations");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href="/reservations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a reservas
      </Link>

      {/* Propiedad y plataforma */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />Datos de la reserva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Propiedad *</Label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccioná propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.filter((p) => p.status === "ACTIVE").map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.colorTag }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plataforma *</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as Platform })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["AIRBNB", "BOOKING", "DIRECT", "OTHER"] as Platform[]).map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Check-in *</Label>
              <div className="flex gap-2">
                <Input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} required className="flex-1" />
                <Input type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} className="w-28" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Check-out *</Label>
              <div className="flex gap-2">
                <Input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} required className="flex-1" />
                <Input type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} className="w-28" />
              </div>
            </div>
            {nights > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{nights} noche{nights > 1 ? "s" : ""}</span>
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>ID externo (Airbnb/Booking)</Label>
              <Input placeholder="Ej: HM3X7B9K" value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado de pago</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="PARTIAL">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Montos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />Montos (ARS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monto bruto cobrado *</Label>
              <Input type="number" min={0} step={100} placeholder="0" value={form.grossAmount} onChange={(e) => setForm({ ...form, grossAmount: e.target.value })} required />
              <p className="text-xs text-muted-foreground">Lo que cobró la plataforma al huésped</p>
            </div>
            <div className="space-y-1.5">
              <Label>Cargos de plataforma</Label>
              <Input type="number" min={0} step={100} placeholder="0" value={form.platformFee} onChange={(e) => setForm({ ...form, platformFee: e.target.value })} />
              <p className="text-xs text-muted-foreground">Comisión Airbnb/Booking</p>
            </div>
          </div>
          {grossNum > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto bruto</span>
                <span className="font-medium">{formatARS(grossNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargos plataforma</span>
                <span className="text-red-500">- {formatARS(feeNum)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="font-semibold">Neto a liquidar</span>
                <span className="font-bold text-primary">{formatARS(netAmount)}</span>
              </div>
              {selectedProperty && (
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-1.5">
                  <span>Comisión Gesting ({selectedProperty.commissionRate}%)</span>
                  <span>{formatARS(netAmount * selectedProperty.commissionRate / 100)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Huésped */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />Huésped
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={!form.newGuest ? "default" : "outline"} onClick={() => setForm({ ...form, newGuest: false, guestId: "" })}>
              Huésped existente
            </Button>
            <Button type="button" size="sm" variant={form.newGuest ? "default" : "outline"} onClick={() => setForm({ ...form, newGuest: true, guestId: "" })}>
              <Plus className="h-3.5 w-3.5" />Nuevo huésped
            </Button>
          </div>

          {!form.newGuest ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar huésped..." className="pl-9 text-sm" value={guestSearch} onChange={(e) => { setGuestSearch(e.target.value); setShowGuestSearch(true); }} onFocus={() => setShowGuestSearch(true)} />
              </div>
              {showGuestSearch && guestSearch && (
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredGuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">Sin resultados</p>
                  ) : filteredGuests.map((g) => (
                    <button key={g.id} type="button"
                      className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                        form.guestId === g.id && "bg-primary/10 text-primary")}
                      onClick={() => { setForm({ ...form, guestId: g.id }); setGuestSearch(`${g.firstName} ${g.lastName}`); setShowGuestSearch(false); }}>
                      <span>{g.firstName} {g.lastName}</span>
                      <span className="text-xs text-muted-foreground">{g.nationality}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.guestId && (
                <p className="text-xs text-emerald-600 font-medium">✓ Huésped seleccionado</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.guestFirstName} onChange={(e) => setForm({ ...form, guestFirstName: e.target.value })} required={form.newGuest} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input value={form.guestLastName} onChange={(e) => setForm({ ...form, guestLastName: e.target.value })} required={form.newGuest} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nacionalidad</Label>
                <Input value={form.guestNationality} onChange={(e) => setForm({ ...form, guestNationality: e.target.value })} />
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label>Notas</Label>
            <Textarea placeholder="Observaciones sobre la reserva..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Crear reserva"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/reservations")}>Cancelar</Button>
      </div>
    </form>
  );
}
