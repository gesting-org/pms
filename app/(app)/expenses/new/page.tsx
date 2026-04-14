"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { Receipt, ChevronLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    propertyId: "", category: "CLEANING", description: "",
    amount: "", date: new Date().toISOString().split("T")[0],
    status: "ADVANCED_BY_GESTING", notes: "",
  });

  useEffect(() => {
    fetch("/api/properties").then((r) => r.json()).then((j) => {
      if (j.ok) setProperties(j.data);
    });
  }, []);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyId || !form.description || !form.amount) {
      toast({ title: "Campos requeridos", variant: "destructive" }); return;
    }
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.ok) {
      toast({ title: "Error al guardar", description: json.error, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: "Gasto registrado" });
    router.push("/expenses");
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nuevo gasto" />
      <div className="p-4 md:p-6 max-w-xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Link href="/expenses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Volver
          </Link>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" />Datos del gasto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Propiedad *</Label>
                  <Select value={form.propertyId} onValueChange={(v) => set("propertyId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná propiedad" /></SelectTrigger>
                    <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Descripción *</Label>
                  <Input placeholder="Ej: Limpieza post check-out — Lucía García" value={form.description} onChange={(e) => set("description", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Monto (ARS) *</Label>
                  <Input type="number" min={0} step={100} placeholder="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADVANCED_BY_GESTING">Adelantado por Gesting</SelectItem>
                      <SelectItem value="PAID_BY_OWNER">Pagado por propietario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Comprobante</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed cursor-pointer hover:bg-accent transition-colors text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />Subir foto o PDF del comprobante
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-6">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Registrar gasto"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/expenses")}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
