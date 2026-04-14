"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Owner, Property, Platform, PropertyStatus } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, User, Settings2, X, Plus, Loader2, ChevronLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const AMENITIES_SUGERIDOS = [
  "WiFi", "Aire acondicionado", "Calefacción", "Smart TV", "Netflix",
  "Cocina equipada", "Lavarropas", "Secador de pelo", "Balcón", "Terraza",
  "Parrilla", "Piscina", "Jardín", "Cochera", "Ascensor",
  "Portero eléctrico", "Seguridad 24h", "Apto mascotas",
];

const COLOR_OPTIONS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

const PLATFORMS: Platform[] = ["AIRBNB", "BOOKING", "DIRECT", "OTHER"];
const PLATFORM_LABELS: Record<Platform, string> = {
  AIRBNB: "Airbnb", BOOKING: "Booking.com", DIRECT: "Directo", OTHER: "Otro",
};

interface PropertyFormProps {
  owners: Owner[];
  property?: Property;
}

type PlatformEntry = {
  platform: Platform;
  listingUrl: string;
  isActive: boolean;
};

export function PropertyForm({ owners, property }: PropertyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");

  const [form, setForm] = useState({
    name:           property?.name ?? "",
    ownerId:        property?.ownerId ?? "",
    address:        property?.address ?? "",
    city:           property?.city ?? "Buenos Aires",
    province:       property?.province ?? "CABA",
    bedrooms:       property?.bedrooms ?? 1,
    bathrooms:      property?.bathrooms ?? 1,
    maxGuests:      property?.maxGuests ?? 2,
    commissionRate: property?.commissionRate ?? 20,
    cleaningFee:    property?.cleaningFee ?? 5000,
    nightlyRate:    property?.nightlyRate ?? 15000,
    status:         (property?.status ?? "ACTIVE") as PropertyStatus,
    colorTag:       property?.colorTag ?? "#3B82F6",
    amenities:      property?.amenities ?? [] as string[],
    description:    property?.description ?? "",
    notes:          property?.notes ?? "",
  });

  const [activePlatforms, setActivePlatforms] = useState<PlatformEntry[]>(
    property?.platforms
      ? property.platforms.map((pl) => ({ platform: pl.platform, listingUrl: pl.listingUrl ?? "", isActive: pl.isActive }))
      : []
  );

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, trimmed] }));
      setCustomAmenity("");
    }
  }

  function togglePlatform(platform: Platform) {
    setActivePlatforms((prev) => {
      const exists = prev.find((p) => p.platform === platform);
      if (exists) return prev.filter((p) => p.platform !== platform);
      return [...prev, { platform, listingUrl: "", isActive: true }];
    });
  }

  function updatePlatformUrl(platform: Platform, url: string) {
    setActivePlatforms((prev) =>
      prev.map((p) => p.platform === platform ? { ...p, listingUrl: url } : p)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerId) {
      toast({ title: "Seleccioná un propietario", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...(property ? { id: property.id } : {}),
      ...form,
      platforms: activePlatforms,
    };
    const res = await fetch("/api/properties", {
      method: property ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) {
      toast({ title: "Error al guardar", description: json.error, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: property ? "Propiedad actualizada" : "Propiedad creada" });
    router.push("/properties");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a propiedades
      </Link>

      {/* Datos básicos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />Datos de la propiedad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre de la propiedad *</Label>
              <Input id="name" placeholder="Ej: Loft Palermo" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input id="address" placeholder="Ej: Av. Santa Fe 2100, Piso 3B" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad *</Label>
              <Input id="city" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" placeholder="Descripción del alojamiento..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Propietario y estado */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />Propietario y estado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Propietario *</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccioná propietario" /></SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.firstName} {o.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PropertyStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                  <SelectItem value="PAUSED">Pausada</SelectItem>
                  <SelectItem value="INACTIVE">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color tag */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Color identificador</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setForm({ ...form, colorTag: c })}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      form.colorTag === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacidad y tarifas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />Capacidad y tarifas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bedrooms">Habitaciones</Label>
              <Input id="bedrooms" type="number" min={0} max={20} value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input id="bathrooms" type="number" min={0} max={10} value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxGuests">Huéspedes máx.</Label>
              <Input id="maxGuests" type="number" min={1} max={30} value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nightlyRate">Tarifa/noche (ARS) *</Label>
              <Input id="nightlyRate" type="number" min={0} step={500} value={form.nightlyRate}
                onChange={(e) => setForm({ ...form, nightlyRate: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cleaningFee">Costo limpieza (ARS)</Label>
              <Input id="cleaningFee" type="number" min={0} step={100} value={form.cleaningFee}
                onChange={(e) => setForm({ ...form, cleaningFee: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commissionRate">Comisión Gesting (%)</Label>
              <Input id="commissionRate" type="number" min={0} max={50} step={0.5} value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plataformas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />Plataformas de publicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PLATFORMS.map((platform) => {
            const entry = activePlatforms.find((p) => p.platform === platform);
            const isActive = !!entry;
            return (
              <div key={platform} className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      isActive ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    {isActive && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </button>
                  <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
                </div>
                {isActive && (
                  <div className="ml-8">
                    <Input
                      placeholder="URL del listing (opcional)"
                      value={entry?.listingUrl ?? ""}
                      onChange={(e) => updatePlatformUrl(platform, e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Amenidades */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Amenidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {AMENITIES_SUGERIDOS.map((a) => {
              const sel = form.amenities.includes(a);
              return (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                    sel
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary/40"
                  )}>
                  {a}
                </button>
              );
            })}
          </div>
          {form.amenities.filter((a) => !AMENITIES_SUGERIDOS.includes(a)).map((a) => (
            <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full mr-1">
              {a}
              <button type="button" onClick={() => toggleAmenity(a)}><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Agregar amenidad..." value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
              className="h-8 text-sm" />
            <Button type="button" size="sm" variant="outline" onClick={addCustomAmenity}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Notas internas</CardTitle></CardHeader>
        <CardContent>
          <Textarea placeholder="Notas para el equipo de gestión..." value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : (property ? "Guardar cambios" : "Crear propiedad")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/properties")}>Cancelar</Button>
      </div>
    </form>
  );
}
