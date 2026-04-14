"use client";

import Link from "next/link";
import { Owner, Property, ManagementContract } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, Pencil, Mail, Phone, MapPin, CreditCard,
  Building2, FileText, Share2, Copy, Check, Bed, Users,
} from "lucide-react";
import { useState, useCallback } from "react";

function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const PROP_STATUS_PILL: Record<string, string> = {
  ACTIVE: "pill-active", MAINTENANCE: "pill-warning", PAUSED: "pill-inactive", INACTIVE: "pill-danger",
};
const PROP_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa", MAINTENANCE: "Mantenimiento", PAUSED: "Pausada", INACTIVE: "Inactiva",
};
const CONTRACT_STATUS_PILL: Record<string, string> = {
  DRAFT: "pill-draft", ACTIVE: "pill-active", EXPIRING_SOON: "pill-warning",
  EXPIRED: "pill-danger", TERMINATED: "pill-inactive",
};
const CONTRACT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador", ACTIVE: "Activo", EXPIRING_SOON: "Por vencer",
  EXPIRED: "Vencido", TERMINATED: "Rescindido",
};

export function OwnerDetail({ owner: o, properties, contracts }: {
  owner: Owner; properties: Property[]; contracts: ManagementContract[];
}) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const hasPassword = !!(o as any).portalPassword;

  const setPassword = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/owners/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: o.id }),
      });
      const data = await res.json();
      if (data.ok) setGeneratedPassword(data.password);
    } finally {
      setGenerating(false);
    }
  }, [o.id]);

  const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-5">
      <Link href="/owners" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a propietarios
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {o.firstName.charAt(0)}{o.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{o.firstName} {o.lastName}</h2>
              <p className="text-sm text-muted-foreground">DNI {o.dni}{o.cuit && ` · CUIT ${o.cuit}`}</p>
              <span className={cn("pill mt-1.5", o.isActive ? "pill-active" : "pill-inactive")}>
                {o.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={setPassword} disabled={generating}>
              <Share2 className="h-3.5 w-3.5" />
              {generating ? "Generando..." : hasPassword ? "Resetear acceso" : "Generar acceso"}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/owners/${o.id}/edit`}><Pencil className="h-3.5 w-3.5" />Editar</Link>
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Propiedades</p>
            <p className="text-lg font-bold text-foreground">{properties.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contratos activos</p>
            <p className="text-lg font-bold text-foreground">{activeContracts}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Comisión promedio</p>
            <p className="text-lg font-bold text-primary">
              {contracts.length > 0
                ? `${(contracts.reduce((s, c) => s + c.commissionRate, 0) / contracts.length).toFixed(0)}%`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="w-full sm:w-auto flex sm:inline-flex">
          <TabsTrigger value="info">Datos personales</TabsTrigger>
          <TabsTrigger value="properties">Propiedades ({properties.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Contacto</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-foreground"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{o.email}</p>
                {o.phone && <p className="flex items-center gap-2 text-foreground"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{o.phone}</p>}
                {o.address && <p className="flex items-center gap-2 text-foreground"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{o.address}{o.city && `, ${o.city}`}</p>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Datos bancarios</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {o.bankName ? (
                  <>
                    <p className="flex items-center gap-2 text-foreground"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" />{o.bankName}</p>
                    {o.bankAlias && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(o.bankAlias!); }}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
                      >
                        <Copy className="h-3 w-3" />{o.bankAlias}
                      </button>
                    )}
                    {o.bankAccount && <p className="text-xs text-muted-foreground">CBU: {o.bankAccount}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground">Sin datos bancarios</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Acceso al portal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                El propietario ingresa con su email y una contraseña personal en{" "}
                <a
                  href="/owner-portal/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded hover:bg-muted/70 text-primary underline-offset-2 hover:underline transition-colors"
                >
                  /owner-portal/login
                </a>
              </p>

              {/* Credentials section */}
              <div className="rounded-lg border border-border p-3 space-y-2.5 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Email de acceso</p>
                    <p className="text-sm font-medium">{o.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Contraseña</p>
                    <p className="text-sm text-muted-foreground">
                      {generatedPassword
                        ? <span className="font-mono text-foreground font-semibold">{generatedPassword}</span>
                        : hasPassword ? "••••••••  (ya configurada)" : "No configurada"
                      }
                    </p>
                  </div>
                  {generatedPassword && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                    }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={setPassword} disabled={generating} variant="outline" className="h-8 text-xs flex-1">
                  <Share2 className="h-3 w-3" />
                  {generating ? "Generando..." : hasPassword ? "Resetear contraseña" : "Generar acceso"}
                </Button>
                {generatedPassword && (
                  <Button size="sm" onClick={() => {
                    navigator.clipboard.writeText(`Portal: ${typeof window !== "undefined" ? window.location.origin : ""}/owner-portal/login\nEmail: ${o.email}\nContraseña: ${generatedPassword}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} variant="outline" className="h-8 text-xs flex-1">
                    {copied ? <><Check className="h-3 w-3 text-emerald-500" />Copiado</> : <><Copy className="h-3 w-3" />Copiar credenciales</>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-2">
          {properties.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">Sin propiedades</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {properties.map((p) => (
                <Link key={p.id} href={`/properties/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_14%_98%)] transition-colors group">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: p.colorTag }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                      {p.address}, {p.city}
                      <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.maxGuests}</span>
                    </p>
                  </div>
                  <span className={cn("pill text-[11px] shrink-0", PROP_STATUS_PILL[p.status])}>
                    {PROP_STATUS_LABEL[p.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-2">
          {contracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-border shadow-xs flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">Sin contratos</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border shadow-xs divide-y divide-border">
              {contracts.map((c) => (
                <Link key={c.id} href={`/contracts/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_14%_98%)] transition-colors group">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{c.contractNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.startDate)} → {formatDate(c.endDate)} · {c.commissionRate}% comisión</p>
                  </div>
                  <span className={cn("pill text-[11px] shrink-0", CONTRACT_STATUS_PILL[c.status])}>
                    {CONTRACT_STATUS_LABEL[c.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
