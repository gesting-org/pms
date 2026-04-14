"use client";

import { useState } from "react";
import Link from "next/link";
import { Liquidation, Property, Owner, Expense, Reservation, Guest } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIQUIDATION_STATUS_LABELS, EXPENSE_CATEGORY_LABELS, formatARS, formatDate } from "@/lib/utils";
import { ChevronLeft, Download, DollarSign, Receipt, Calendar, Check, AlertTriangle, Loader2, Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ResWithGuest = Reservation & { guest: Guest };

const STATUS_BADGE: Record<string, any> = {
  PENDING: "warning", SENT: "info", PAID: "success", OVERDUE: "destructive",
};

export function LiquidationDetail({ liquidation: l, property, owner, expenses, reservations }: {
  liquidation: Liquidation; property: Property; owner: Owner;
  expenses: Expense[]; reservations: ResWithGuest[];
}) {
  const { toast } = useToast();
  const [marking, setMarking] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: "Transferencia bancaria", reference: "" });
  const [showPayForm, setShowPayForm] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | undefined>((l as any).invoiceUrl);
  const [invoiceFileName, setInvoiceFileName] = useState<string | undefined>((l as any).invoiceFileName);
  const [uploading, setUploading] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  async function handleInvoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/liquidations/${l.id}/invoice`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setInvoiceUrl(data.invoiceUrl);
        setInvoiceFileName(data.invoiceFileName);
        toast({ title: "Factura subida correctamente" });
      } else {
        toast({ title: data.error ?? "Error al subir", variant: "destructive" });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleInvoiceDelete() {
    setDeletingInvoice(true);
    try {
      const res = await fetch(`/api/liquidations/${l.id}/invoice`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setInvoiceUrl(undefined);
        setInvoiceFileName(undefined);
        toast({ title: "Factura eliminada" });
      } else {
        toast({ title: data.error ?? "Error al eliminar", variant: "destructive" });
      }
    } finally {
      setDeletingInvoice(false);
    }
  }

  async function markAsPaid() {
    setMarking(true);
    try {
      const res = await fetch(`/api/liquidations/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: paymentForm.method,
          paymentReference: paymentForm.reference || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Error al guardar");
      toast({ title: "Liquidación marcada como pagada" });
      setShowPayForm(false);
      window.location.reload();
    } catch (err: any) {
      toast({ title: err.message ?? "Error", variant: "destructive" });
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/liquidations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a liquidaciones
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{l.periodLabel}</h2>
            <Badge variant={STATUS_BADGE[l.status]}>{LIQUIDATION_STATUS_LABELS[l.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link href={`/properties/${property.id}`} className="hover:text-primary transition-colors">{property.name}</Link>
            {" · "}{owner.firstName} {owner.lastName}
          </p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" />PDF</Button>
      </div>

      {l.status === "OVERDUE" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="text-red-800">Liquidación vencida. Vence: {formatDate(l.dueDate)}</span>
        </div>
      )}

      {/* Cálculo principal */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Cálculo de liquidación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ingresos brutos</span>
            <span className="font-medium">{formatARS(l.grossRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gastos operativos</span>
            <span className="text-red-500">- {formatARS(l.totalExpenses)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comisión Gesting</span>
            <span className="text-primary font-semibold">- {formatARS(l.commissionAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Neto a propietario</span>
            <span className="text-emerald-600">{formatARS(l.netToOwner)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Fecha de vencimiento</span>
            <span>{formatDate(l.dueDate)}</span>
          </div>
          {l.paidDate && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span className="flex items-center gap-1"><Check className="h-3 w-3" />Pagado el</span>
              <span>{formatDate(l.paidDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservas del período */}
      {reservations.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />Reservas del período ({reservations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{r.guest.firstName} {r.guest.lastName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.checkIn)} → {formatDate(r.checkOut)} · {r.nights}n</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatARS(r.grossAmount)}</p>
                    <p className="text-xs text-muted-foreground">Neto: {formatARS(r.netAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gastos */}
      {expenses.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />Gastos operativos ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_LABELS[e.category]} · {formatDate(e.date)}</p>
                  </div>
                  <p className="font-semibold text-red-500">- {formatARS(e.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factura */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />Factura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceUrl ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-800 truncate">{invoiceFileName ?? "Factura"}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />Ver
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleInvoiceDelete} disabled={deletingInvoice}>
                  {deletingInvoice ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleInvoiceUpload} disabled={uploading} />
                  <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium border border-input bg-background hover:bg-accent transition-colors">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Reemplazar
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer w-full">
              <input type="file" accept="application/pdf" className="hidden" onChange={handleInvoiceUpload} disabled={uploading} />
              <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-colors">
                {uploading
                  ? <><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Subiendo...</p></>
                  : <><Upload className="h-6 w-6 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Subir factura PDF</p><p className="text-xs text-muted-foreground">Máximo 10MB</p></>
                }
              </div>
            </label>
          )}
        </CardContent>
      </Card>

      {/* Registrar pago */}
      {l.status !== "PAID" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Registrar pago</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!showPayForm ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">{formatARS(l.netToOwner)}</p>
                  <p className="text-xs text-muted-foreground">a transferir a {owner.firstName} {owner.lastName}</p>
                  {owner.bankAlias && <p className="text-xs font-mono mt-0.5">{owner.bankAlias}</p>}
                </div>
                <Button onClick={() => setShowPayForm(true)}><Check className="h-4 w-4" />Marcar como pagado</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Medio de pago</Label>
                    <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transferencia bancaria">Transferencia bancaria</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Referencia / Comprobante</Label>
                    <Input placeholder="Nro. transferencia, etc." value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={markAsPaid} disabled={marking} className="bg-emerald-600 hover:bg-emerald-700">
                    {marking ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><Check className="h-4 w-4" />Confirmar pago</>}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPayForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
