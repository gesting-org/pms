"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Key, Bell, FileText, Percent, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const DEFAULTS = {
  company: {
    companyName: "Gesting PMS", legalName: "", cuit: "", representative: "",
    address: "", city: "Buenos Aires", province: "Buenos Aires",
    phone: "", email: "", website: "",
  },
  finance: { defaultCommission: "20", lateFeeRate: "10", liquidationDueDay: "5", currency: "ARS" },
  templates: {
    contractTemplate: "En la ciudad de Buenos Aires, siendo el [FECHA], entre [PROPIETARIO] (el «Propietario») y Gesting Administración de Propiedades SRL (el «Administrador»), se celebra el presente Contrato de Gestión de Propiedad Turística, sujeto a las siguientes cláusulas:",
    welcomeEmailTpl: "Bienvenido/a a [PROPIEDAD]. Tu check-in es el [FECHA_CHECKIN] a partir de las 15:00 hs. El código de acceso es [CODIGO]. Ante cualquier consulta escribinos a info@gesting.com.ar.",
    checkoutEmailTpl: "Esperamos que hayas disfrutado tu estadía en [PROPIEDAD]. El check-out es a las 11:00 hs del [FECHA_CHECKOUT]. Por favor dejá las llaves en el mismo lugar donde las encontraste.",
    liquidationEmailTpl: "Estimado/a [PROPIETARIO], adjunto encontrarás la liquidación correspondiente a [MES]. Neto a transferirte: [MONTO]. El pago se realizará antes del [FECHA_VENCIMIENTO]. Muchas gracias.",
  },
  keys: { claudeApiKey: "", resendApiKey: "", whatsappApiKey: "", whatsappPhone: "" },
  notifications: {
    notifCheckIn: true, notifCheckOut: true,
    notifContractExp30: true, notifContractExp60: true,
    notifLiqOverdue: true, notifTaskOverdue: true,
    notifNewReservation: true, notifPaymentReceived: false,
  },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [company, setCompany] = useState(DEFAULTS.company);
  const [finance, setFinance] = useState(DEFAULTS.finance);
  const [templates, setTemplates] = useState(DEFAULTS.templates);
  const [keys, setKeys] = useState(DEFAULTS.keys);
  const [notifications, setNotifications] = useState(DEFAULTS.notifications);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        setCompany({
          companyName: data.companyName ?? DEFAULTS.company.companyName,
          legalName: data.legalName ?? "",
          cuit: data.cuit ?? "",
          representative: data.representative ?? "",
          address: data.address ?? "",
          city: data.city ?? "Buenos Aires",
          province: data.province ?? "Buenos Aires",
          phone: data.phone ?? "",
          email: data.email ?? "",
          website: data.website ?? "",
        });
        setFinance({
          defaultCommission: String(data.defaultCommission ?? 20),
          lateFeeRate: String(data.lateFeeRate ?? 10),
          liquidationDueDay: String(data.liquidationDueDay ?? 5),
          currency: data.currency ?? "ARS",
        });
        setTemplates({
          contractTemplate: data.contractTemplate ?? DEFAULTS.templates.contractTemplate,
          welcomeEmailTpl: data.welcomeEmailTpl ?? DEFAULTS.templates.welcomeEmailTpl,
          checkoutEmailTpl: data.checkoutEmailTpl ?? DEFAULTS.templates.checkoutEmailTpl,
          liquidationEmailTpl: data.liquidationEmailTpl ?? DEFAULTS.templates.liquidationEmailTpl,
        });
        setKeys({
          claudeApiKey: data.claudeApiKey ?? "",
          resendApiKey: data.resendApiKey ?? "",
          whatsappApiKey: data.whatsappApiKey ?? "",
          whatsappPhone: data.whatsappPhone ?? "",
        });
        setNotifications({
          notifCheckIn: data.notifCheckIn ?? true,
          notifCheckOut: data.notifCheckOut ?? true,
          notifContractExp30: data.notifContractExp30 ?? true,
          notifContractExp60: data.notifContractExp60 ?? true,
          notifLiqOverdue: data.notifLiqOverdue ?? true,
          notifTaskOverdue: data.notifTaskOverdue ?? true,
          notifNewReservation: data.notifNewReservation ?? true,
          notifPaymentReceived: data.notifPaymentReceived ?? false,
        });
      })
      .catch(() => toast({ title: "Error al cargar configuración", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  async function save(section: "company" | "finance" | "templates" | "keys" | "notifications") {
    setSaving(true);
    const payload =
      section === "company" ? company :
      section === "finance" ? finance :
      section === "templates" ? templates :
      section === "keys" ? keys :
      notifications;

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Error");
      toast({ title: "Configuración guardada", description: "Los cambios fueron aplicados correctamente." });
    } catch (err: any) {
      toast({ title: err.message ?? "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function setC(k: string, v: string) { setCompany((p) => ({ ...p, [k]: v })); }
  function setF(k: string, v: string) { setFinance((p) => ({ ...p, [k]: v })); }
  function setT(k: string, v: string) { setTemplates((p) => ({ ...p, [k]: v })); }
  function setK(k: string, v: string) { setKeys((p) => ({ ...p, [k]: v })); }
  function toggleKey(k: string) { setShowKeys((p) => ({ ...p, [k]: !p[k] })); }

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Configuración" subtitle="Ajustes del sistema" />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Configuración" subtitle="Ajustes del sistema" />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <Tabs defaultValue="company">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Empresa</TabsTrigger>
            <TabsTrigger value="finance" className="gap-1.5"><Percent className="h-3.5 w-3.5" />Finanzas</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Plantillas</TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5"><Key className="h-3.5 w-3.5" />Integraciones</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notificaciones</TabsTrigger>
          </TabsList>

          {/* Datos de la empresa */}
          <TabsContent value="company" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Datos de Gesting PMS</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre comercial</Label>
                    <Input value={company.companyName} onChange={(e) => setC("companyName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Razón social</Label>
                    <Input value={company.legalName} onChange={(e) => setC("legalName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CUIT</Label>
                    <Input value={company.cuit} onChange={(e) => setC("cuit", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Representante legal</Label>
                    <Input value={company.representative} onChange={(e) => setC("representative", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Domicilio</Label>
                    <Input value={company.address} onChange={(e) => setC("address", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ciudad</Label>
                    <Input value={company.city} onChange={(e) => setC("city", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Provincia</Label>
                    <Input value={company.province} onChange={(e) => setC("province", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono</Label>
                    <Input value={company.phone} onChange={(e) => setC("phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={company.email} onChange={(e) => setC("email", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Sitio web</Label>
                    <Input value={company.website} onChange={(e) => setC("website", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => save("company")} disabled={saving} className="min-w-32">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
          </TabsContent>

          {/* Finanzas */}
          <TabsContent value="finance" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4 text-primary" />Parámetros financieros</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Comisión default (%)</Label>
                    <div className="relative">
                      <Input type="number" min="0" max="100" step="0.5" value={finance.defaultCommission}
                        onChange={(e) => setF("defaultCommission", e.target.value)} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Se aplica a propiedades nuevas.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tasa de mora diaria (%)</Label>
                    <div className="relative">
                      <Input type="number" min="0" max="100" step="0.5" value={finance.lateFeeRate}
                        onChange={(e) => setF("lateFeeRate", e.target.value)} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vencimiento liquidación (día hábil N°)</Label>
                    <Input type="number" min="1" max="10" value={finance.liquidationDueDay}
                      onChange={(e) => setF("liquidationDueDay", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Moneda principal</Label>
                    <Input value={finance.currency} onChange={(e) => setF("currency", e.target.value)} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Resumen de parámetros activos</p>
                  {[
                    { label: "Comisión default", value: `${finance.defaultCommission}%` },
                    { label: "Mora por día de retraso", value: `${finance.lateFeeRate}%` },
                    { label: "Vencimiento liquidaciones", value: `Día hábil N° ${finance.liquidationDueDay}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => save("finance")} disabled={saving} className="min-w-32">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
          </TabsContent>

          {/* Plantillas */}
          <TabsContent value="templates" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Plantillas de texto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground">Usá variables entre corchetes: [PROPIEDAD], [PROPIETARIO], [FECHA], [MONTO], [CODIGO], etc.</p>
                {[
                  { key: "contractTemplate", label: "Introducción del contrato", rows: 4 },
                  { key: "welcomeEmailTpl", label: "Email de bienvenida al huésped", rows: 4 },
                  { key: "checkoutEmailTpl", label: "Email de recordatorio check-out", rows: 4 },
                  { key: "liquidationEmailTpl", label: "Email de envío de liquidación", rows: 4 },
                ].map((t) => (
                  <div key={t.key} className="space-y-1.5">
                    <Label>{t.label}</Label>
                    <Textarea rows={t.rows} value={templates[t.key as keyof typeof templates]}
                      onChange={(e) => setT(t.key, e.target.value)} className="text-sm" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => save("templates")} disabled={saving} className="min-w-32">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
          </TabsContent>

          {/* Integraciones */}
          <TabsContent value="integrations" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4 text-primary" />API Keys e integraciones</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground">Las claves se almacenan en la base de datos y nunca se exponen en el frontend.</p>
                {[
                  { key: "claudeApiKey", label: "Claude AI (Anthropic API Key)", placeholder: "sk-ant-...", hint: "Para generación de contratos, resúmenes y sugerencias de respuesta" },
                  { key: "resendApiKey", label: "Resend (Email API Key)", placeholder: "re_...", hint: "Para envío de emails automáticos a propietarios y huéspedes" },
                  { key: "whatsappApiKey", label: "WhatsApp Business API Key", placeholder: "EAA...", hint: "Para mensajes automáticos por WhatsApp" },
                  { key: "whatsappPhone", label: "WhatsApp número de teléfono", placeholder: "+541112345678", hint: "Número registrado en WhatsApp Business" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    <div className="relative">
                      <Input
                        type={showKeys[field.key] ? "text" : "password"}
                        value={keys[field.key as keyof typeof keys]}
                        onChange={(e) => setK(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="pr-10 font-mono text-sm"
                      />
                      <button type="button" onClick={() => toggleKey(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showKeys[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                    {keys[field.key as keyof typeof keys] && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />Clave configurada
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => save("keys")} disabled={saving} className="min-w-32">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Guardar claves"}
              </Button>
            </div>
          </TabsContent>

          {/* Notificaciones */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Alertas y notificaciones</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: "notifCheckIn", label: "Recordatorio de check-in", desc: "Notificar 1 día antes del check-in" },
                  { key: "notifCheckOut", label: "Recordatorio de check-out", desc: "Notificar el día del check-out" },
                  { key: "notifContractExp30", label: "Vencimiento de contrato (30 días)", desc: "Alertar cuando un contrato vence en 30 días" },
                  { key: "notifContractExp60", label: "Vencimiento de contrato (60 días)", desc: "Alertar cuando un contrato vence en 60 días" },
                  { key: "notifLiqOverdue", label: "Liquidación vencida", desc: "Alertar cuando una liquidación supera la fecha de vencimiento" },
                  { key: "notifTaskOverdue", label: "Tarea vencida", desc: "Notificar tareas que superaron su fecha límite" },
                  { key: "notifNewReservation", label: "Nueva reserva", desc: "Notificación al registrar una reserva nueva" },
                  { key: "notifPaymentReceived", label: "Pago recibido", desc: "Notificación al registrar un pago de liquidación" },
                ].map((item, i, arr) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ml-4 ${notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow ${notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => save("notifications")} disabled={saving} className="min-w-32">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
