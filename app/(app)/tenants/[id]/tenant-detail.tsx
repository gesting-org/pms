"use client";

import Link from "next/link";
type Tenant = any; type Contract = any; type Payment = any; type Message = any; type Property = any;
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Pencil, Mail, Phone, MapPin, Briefcase, User,
  FileText, DollarSign, MessageSquare, ChevronRight,
  Star, Shield, AlertTriangle, Plus,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────
function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
}

const SCORE_STYLE: Record<Tenant["score"], { pill: string; color: string; label: string }> = {
  EXCELENTE: { pill: "pill-active",  color: "text-emerald-600", label: "Excelente" },
  BUENO:     { pill: "pill-info",    color: "text-blue-600",    label: "Bueno"     },
  REGULAR:   { pill: "pill-warning", color: "text-amber-600",   label: "Regular"   },
  MALO:      { pill: "pill-danger",  color: "text-red-600",     label: "Malo"      },
};

const CONTRACT_PILL: Record<string, string> = {
  BORRADOR: "pill-draft", ACTIVO: "pill-active", POR_VENCER: "pill-warning",
  VENCIDO: "pill-danger", RESCINDIDO: "pill-inactive",
};
const CONTRACT_LABEL: Record<string, string> = {
  BORRADOR: "Borrador", ACTIVO: "Activo", POR_VENCER: "Por vencer",
  VENCIDO: "Vencido", RESCINDIDO: "Rescindido",
};
const PAYMENT_PILL: Record<string, string> = {
  PENDIENTE: "pill-info", PAGADO: "pill-active", VENCIDO: "pill-danger", PARCIAL: "pill-warning",
};
const PAYMENT_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente", PAGADO: "Pagado", VENCIDO: "Vencido", PARCIAL: "Parcial",
};

// ════════════════════════════════════════════════════════════════

type ContractWithProperty = Contract & { property: Property | null };

interface TenantDetailProps {
  tenant: Tenant;
  contracts: ContractWithProperty[];
  payments: Payment[];
  messages: Message[];
}

export function TenantDetail({ tenant: t, contracts, payments, messages }: TenantDetailProps) {
  const score       = SCORE_STYLE[t.score];
  const activeCtx   = contracts.find((c) => c.status === "ACTIVO");
  const overduePays = payments.filter((p) => p.status === "VENCIDO");
  const unreadMsgs  = messages.filter((m) => !m.isRead && m.direction === "ENTRANTE");

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Header ── */}
      <div className="bg-white rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
              t.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {t.firstName[0]}{t.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.firstName} {t.lastName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">DNI {t.dni}{t.cuit && ` · CUIT ${t.cuit}`}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("pill", score.pill)}>
                  <Star className="h-2.5 w-2.5" />
                  {score.label}
                </span>
                <span className={cn("pill", t.isActive ? "pill-active" : "pill-inactive")}>
                  {t.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/tenants/${t.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
          </Button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">{t.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{t.phone}</span>
          </div>
          {t.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-xs">{t.address}</span>
            </div>
          )}
          {t.occupation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{t.occupation}{t.employer && ` — ${t.employer}`}</span>
            </div>
          )}
          {t.monthlyIncome && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Ingresos: {formatARS(t.monthlyIncome)}/mes</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{t.nationality}</span>
          </div>
        </div>

        {/* Garante */}
        {t.guarantorName && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Garante</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-foreground">
              <span className="font-medium">{t.guarantorName}</span>
              {t.guarantorDni && <span className="text-muted-foreground">DNI {t.guarantorDni}</span>}
              {t.guarantorPhone && <span className="text-muted-foreground">{t.guarantorPhone}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Alert: overdue ── */}
      {overduePays.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              {overduePays.length} pago{overduePays.length > 1 ? "s" : ""} vencido{overduePays.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs mt-0.5">
              Total adeudado: {formatARS(overduePays.reduce((s, p) => s + p.totalAmount, 0))}
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="contratos">
        <TabsList className="w-full sm:w-auto flex sm:inline-flex overflow-x-auto">
          <TabsTrigger value="contratos">
            Contratos
            {contracts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {contracts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagos">
            Pagos
            {overduePays.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold">
                {overduePays.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="mensajes">
            Mensajes
            {unreadMsgs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                {unreadMsgs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: CONTRATOS ── */}
        <TabsContent value="contratos" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{contracts.length} contrato{contracts.length !== 1 ? "s" : ""}</p>
            <Button asChild size="sm">
              <Link href={`/contracts/new?tenantId=${t.id}`}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo contrato
              </Link>
            </Button>
          </div>
          {contracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">Sin contratos</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {contracts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_14%_98%)] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {c.contractNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.property?.name ?? "Propiedad eliminada"} · {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatARS(c.currentRent)}/mes · ICL c/{c.adjustmentFrequency} meses
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("pill text-[11px]", CONTRACT_PILL[c.status])}>
                      {CONTRACT_LABEL[c.status]}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: PAGOS ── */}
        <TabsContent value="pagos" className="space-y-3">
          <p className="text-sm text-muted-foreground">{payments.length} registros de pago</p>
          {payments.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">Sin pagos registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[hsl(220_14%_98%)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Período</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Concepto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Importe</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Vence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-[hsl(220_14%_98%)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{pay.periodLabel}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{pay.concept}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold tabular-nums">{formatARS(pay.totalAmount)}</span>
                        {pay.surcharge > 0 && (
                          <p className="text-[10px] text-red-500">+{formatARS(pay.surcharge)} mora</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(pay.dueDate)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("pill text-[11px]", PAYMENT_PILL[pay.status])}>
                          {PAYMENT_LABEL[pay.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: MENSAJES ── */}
        <TabsContent value="mensajes" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{messages.length} mensaje{messages.length !== 1 ? "s" : ""}</p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/messages?tenantId=${t.id}`}>
                <MessageSquare className="h-3.5 w-3.5" />
                Ver conversación
              </Link>
            </Button>
          </div>
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">Sin mensajes</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "px-4 py-3",
                  !msg.isRead && msg.direction === "ENTRANTE" && "bg-blue-50/50"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-semibold uppercase tracking-wide",
                          msg.direction === "ENTRANTE" ? "text-blue-600" : "text-emerald-600"
                        )}>
                          {msg.direction === "ENTRANTE" ? "← Recibido" : "→ Enviado"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{msg.channel}</span>
                        {!msg.isRead && msg.direction === "ENTRANTE" && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{msg.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(msg.sentAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
