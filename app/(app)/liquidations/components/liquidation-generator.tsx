"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Property, Owner } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatARS, getLiquidationDueDate, formatDate } from "@/lib/utils";
import { ChevronLeft, Loader2, Calculator, Check, Upload, FileText, X } from "lucide-react";
import Link from "next/link";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface PreviewData {
  reservations: any[];
  expenses: any[];
  grossIncome: number;
  platformFees: number;
  operationalExpenses: number;
  commissionAmount: number;
  netToOwner: number;
  dueDate: Date;
  totalDue: number;
}

export function LiquidationGenerator({ properties, owners }: { properties: Property[]; owners: Owner[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDate = new Date();

  const [form, setForm] = useState({
    propertyId: "",
    year: String(currentDate.getFullYear()),
    month: String(currentDate.getMonth() + 1),
  });

  const selectedProperty = properties.find((p) => p.id === form.propertyId);
  const selectedOwner = owners.find((o) => o.id === (selectedProperty as any)?.ownerId);

  useEffect(() => {
    if (!form.propertyId) { setPreview(null); return; }
    setLoadingPreview(true);
    const year = parseInt(form.year);
    const month = parseInt(form.month);

    fetch(`/api/reservations?propertyId=${form.propertyId}`)
      .then((r) => r.json())
      .then((resJson) => {
        const allReservations: any[] = resJson.ok ? resJson.data : [];
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59);

        const reservations = allReservations.filter((r: any) =>
          r.status === "COMPLETED" &&
          new Date(r.checkIn) >= periodStart &&
          new Date(r.checkIn) <= periodEnd
        );

        const grossIncome = reservations.reduce((s: number, r: any) => s + r.grossAmount, 0);
        const platformFees = reservations.reduce((s: number, r: any) => s + r.platformFee, 0);
        const operationalExpenses = 0;
        const commissionBase = grossIncome - platformFees;
        const commissionRate = (selectedProperty as any)?.commissionRate ?? 20;
        const commissionAmount = commissionBase * commissionRate / 100;
        const netToOwner = commissionBase - commissionAmount - operationalExpenses;
        const dueDate = getLiquidationDueDate(year, month);

        setPreview({ reservations, expenses: [], grossIncome, platformFees, operationalExpenses, commissionAmount, netToOwner, dueDate, totalDue: netToOwner });
        setLoadingPreview(false);
      });
  }, [form.propertyId, form.year, form.month]);

  async function generate() {
    if (!selectedProperty || !preview) return;
    setSaving(true);
    try {
      const year = parseInt(form.year);
      const month = parseInt(form.month);
      const periodLabel = `${MONTHS[month - 1]} ${form.year}`;
      const commissionRate = (selectedProperty as any)?.commissionRate ?? 20;

      // 1. Create liquidation
      const res = await fetch("/api/liquidations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: form.propertyId,
          periodYear: year,
          periodMonth: month,
          periodLabel,
          grossIncome: preview.grossIncome,
          platformFees: preview.platformFees,
          operationalExpenses: preview.operationalExpenses,
          commissionRate,
          commissionAmount: preview.commissionAmount,
          netToOwner: preview.netToOwner,
          totalDue: preview.totalDue,
          dueDate: preview.dueDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Error al crear liquidación");

      const liquidationId = data.id;

      // 2. Upload invoice if provided
      if (invoiceFile) {
        const fd = new FormData();
        fd.append("file", invoiceFile);
        await fetch(`/api/liquidations/${liquidationId}/invoice`, { method: "POST", body: fd });
      }

      toast({ title: "Liquidación generada", description: `${periodLabel} · ${selectedProperty.name}` });
      router.push(`/liquidations/${liquidationId}`);
    } catch (err: any) {
      toast({ title: err.message ?? "Error", variant: "destructive" });
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/liquidations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver
      </Link>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Seleccionar período</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Propiedad</Label>
              <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                <SelectContent>
                  {properties.filter((p) => p.status === "ACTIVE").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingPreview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {preview && selectedProperty && selectedOwner && !loadingPreview && (
        <>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview — {MONTHS[parseInt(form.month) - 1]} {form.year}</CardTitle>
              <p className="text-xs text-muted-foreground">{selectedProperty.name} · {selectedOwner.firstName} {selectedOwner.lastName}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Reservas completadas</span><span className="font-medium">{preview.reservations.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ingresos brutos</span><span className="font-medium">{formatARS(preview.grossIncome)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cargos plataformas</span><span className="text-red-500">- {formatARS(preview.platformFees)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gastos operativos</span><span className="text-red-500">- {formatARS(preview.operationalExpenses)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Comisión Gesting ({(selectedProperty as any).commissionRate}%)</span><span className="text-primary font-semibold">- {formatARS(preview.commissionAmount)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Neto al propietario</span>
                <span className="text-emerald-600">{formatARS(preview.netToOwner)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fecha de vencimiento</span>
                <span>{formatDate(preview.dueDate.toISOString())}</span>
              </div>
              {preview.reservations.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">⚠ No hay reservas completadas en este período.</p>
              )}
            </CardContent>
          </Card>

          {/* Factura */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Adjuntar factura <span className="text-muted-foreground font-normal">(opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceFile ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-800 truncate">{invoiceFile.name}</span>
                    <span className="text-xs text-emerald-600 shrink-0">({(invoiceFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => { setInvoiceFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="h-3 w-3" />Quitar
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer w-full">
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setInvoiceFile(f); }} />
                  <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Subir factura PDF</p>
                    <p className="text-xs text-muted-foreground">Máximo 10MB</p>
                  </div>
                </label>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-3 pb-6">
        <Button onClick={generate} disabled={!selectedProperty || !preview || saving} className="flex-1 sm:flex-none sm:min-w-40">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</> : <><Check className="h-4 w-4" />Generar liquidación</>}
        </Button>
        <Button variant="outline" onClick={() => router.push("/liquidations")}>Cancelar</Button>
      </div>
    </div>
  );
}
