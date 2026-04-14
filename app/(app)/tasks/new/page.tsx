"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TASK_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/utils";
import { CheckSquare, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [propReservations, setPropReservations] = useState<{ id: string; checkOut: string; guestName: string }[]>([]);

  const [form, setForm] = useState({
    propertyId: searchParams.get("propertyId") ?? "",
    reservationId: searchParams.get("reservationId") ?? "",
    type: "CLEANING",
    title: "",
    description: "",
    priority: "MEDIUM",
    scheduledDate: new Date().toISOString().split("T")[0],
    estimatedCost: "",
    provider: "",
  });

  useEffect(() => {
    fetch("/api/properties").then((r) => r.json()).then((j) => {
      if (j.ok) setProperties(j.data);
    });
  }, []);

  useEffect(() => {
    if (!form.propertyId) { setPropReservations([]); return; }
    fetch(`/api/reservations?propertyId=${form.propertyId}`).then((r) => r.json()).then((j) => {
      if (j.ok) setPropReservations(j.data.map((r: any) => ({
        id: r.id,
        checkOut: r.checkOut,
        guestName: `${r.guest?.firstName ?? ""} ${r.guest?.lastName ?? ""}`.trim(),
      })));
    });
  }, [form.propertyId]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyId || !form.title) {
      toast({ title: "Campos requeridos", variant: "destructive" }); return;
    }
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, reservationId: form.reservationId === "none" ? "" : form.reservationId }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast({ title: "Error al guardar", description: json.error, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: "Tarea creada" });
    router.push("/tasks");
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nueva tarea" />
      <div className="p-4 md:p-6 max-w-xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Volver
          </Link>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4 text-primary" />Datos de la tarea</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Propiedad *</Label>
                  <Select value={form.propertyId} onValueChange={(v) => set("propertyId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                    <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Título *</Label>
                  <Input placeholder="Ej: Limpieza post check-out" value={form.title} onChange={(e) => set("title", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Prioridad</Label>
                  <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha programada</Label>
                  <Input type="date" value={form.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Costo estimado (ARS)</Label>
                  <Input type="number" min={0} step={100} placeholder="0" value={form.estimatedCost} onChange={(e) => set("estimatedCost", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Proveedor / Persona</Label>
                  <Input placeholder="Ej: Lucía García" value={form.provider} onChange={(e) => set("provider", e.target.value)} />
                </div>
                {form.propertyId && propReservations.length > 0 && (
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Reserva asociada (opcional)</Label>
                    <Select value={form.reservationId} onValueChange={(v) => set("reservationId", v)}>
                      <SelectTrigger><SelectValue placeholder="Sin reserva asociada" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin reserva</SelectItem>
                        {propReservations.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.guestName} — check-out {r.checkOut}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Detalles de la tarea..." />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-6">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Crear tarea"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/tasks")}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
