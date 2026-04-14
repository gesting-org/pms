"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
type Owner = any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export function OwnerForm({ owner }: { owner?: Owner }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: owner?.firstName ?? "",
    lastName: owner?.lastName ?? "",
    dni: owner?.dni ?? "",
    cuit: owner?.cuit ?? "",
    email: owner?.email ?? "",
    phone: owner?.phone ?? "",
    address: owner?.address ?? "",
    city: owner?.city ?? "Buenos Aires",
    province: owner?.province ?? "CABA",
    bankName: owner?.bankName ?? "",
    bankAccount: owner?.bankAccount ?? "",
    bankAlias: owner?.bankAlias ?? "",
    notes: owner?.notes ?? "",
  });

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dni || !form.email) {
      toast({ title: "Campos requeridos", description: "Nombre, apellido, DNI y email son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/owners", {
      method: owner ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(owner ? { id: owner.id, ...form } : form),
    });
    const json = await res.json();
    if (!json.ok) {
      toast({ title: "Error al guardar", description: json.error, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: owner ? "Propietario actualizado" : "Propietario creado" });
    router.push("/owners");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href="/owners" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver
      </Link>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" />Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Apellido *</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>DNI *</Label><Input value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="25987654" required /></div>
            <div className="space-y-1.5"><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => set("cuit", e.target.value)} placeholder="20-25987654-3" /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+54 9 11 ..." /></div>
            <div className="sm:col-span-2 space-y-1.5"><Label>Domicilio</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Corrientes 1234, Piso 4" /></div>
            <div className="space-y-1.5"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Provincia</Label><Input value={form.province} onChange={(e) => set("province", e.target.value)} /></div>
            <div className="sm:col-span-2 space-y-1.5"><Label>Notas internas</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Observaciones..." /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Datos bancarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Banco</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Banco Galicia" /></div>
            <div className="space-y-1.5"><Label>CBU / CVU</Label><Input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} placeholder="0062-0000-..." /></div>
            <div className="space-y-1.5"><Label>Alias</Label><Input value={form.bankAlias} onChange={(e) => set("bankAlias", e.target.value)} placeholder="NOMBRE.BANCO.ALIAS" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : owner ? "Guardar cambios" : "Crear propietario"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/owners")}>Cancelar</Button>
      </div>
    </form>
  );
}
