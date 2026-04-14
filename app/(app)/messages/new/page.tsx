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
import { ChevronLeft, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";

const DEFAULT_TEMPLATES = [
  { label: "Bienvenida al huésped", body: "Bienvenido a [PROPIEDAD]. Tu check-in es el [FECHA_CHECKIN] a partir de las 15:00 hs. El código de acceso es [CODIGO]. Ante cualquier consulta escribinos." },
  { label: "Recordatorio check-in", body: "Te recordamos que tu check-in en [PROPIEDAD] es mañana. ¡Que disfrutes tu estadía!" },
  { label: "Recordatorio pago comisión", body: "Estimado [PROPIETARIO], te recordamos que la liquidación de [MES] se encuentra pendiente de pago. El monto es [MONTO]. Muchas gracias." },
  { label: "Envío liquidación", body: "Estimado [PROPIETARIO], adjunto encontrarás la liquidación correspondiente a [MES]. Neto a transferirte: [MONTO]. El pago se realizará antes del [FECHA_VENCIMIENTO]. Muchas gracias." },
  { label: "Renovación de contrato", body: "Estimado [PROPIETARIO], tu contrato de gestión vence el [FECHA]. Te enviamos el nuevo contrato para tu revisión y firma." },
];

export default function NewMessagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [guests, setGuests] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [owners, setOwners] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const [form, setForm] = useState({
    recipientType: "guest",
    recipientId: "",
    propertyId: "",
    channel: "EMAIL",
    subject: "",
    body: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/guests").then((r) => r.json()),
      fetch("/api/owners").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([g, o, p, s]) => {
      if (g.ok) setGuests(g.data);
      if (o.ok) setOwners(o.data);
      if (p.ok) setProperties(p.data);
      if (s.ok && s.data) {
        const cfg = s.data;
        const tpls = [...DEFAULT_TEMPLATES];
        if (cfg.welcomeEmailTpl) tpls[0] = { label: "Bienvenida al huésped", body: cfg.welcomeEmailTpl };
        if (cfg.checkoutEmailTpl) tpls[1] = { label: "Recordatorio check-out", body: cfg.checkoutEmailTpl };
        if (cfg.liquidationEmailTpl) tpls[3] = { label: "Envío liquidación", body: cfg.liquidationEmailTpl };
        setTemplates(tpls);
      }
    });
  }, []);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  function applyTemplate(body: string) { setForm((f) => ({ ...f, body })); }

  async function generateAI() {
    if (!form.body.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: form.body }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) { setForm((f) => ({ ...f, body: data.text })); return; }
      }
    } catch {}
    // Fallback: add signature
    setForm((f) => ({ ...f, body: f.body + "\n\nAtentamente,\nEquipo Gesting PMS" }));
    setGenerating(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.body) { toast({ title: "Completá asunto y mensaje", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Error al enviar");
      toast({ title: "Mensaje guardado" });
      router.push("/messages");
    } catch (err: any) {
      toast({ title: err.message ?? "Error", variant: "destructive" });
      setSaving(false);
    }
  }

  const recipients = form.recipientType === "guest" ? guests : owners;

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nuevo mensaje" />
      <div className="p-4 md:p-6 max-w-2xl animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Volver
          </Link>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Nuevo mensaje</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo de destinatario</Label>
                  <Select value={form.recipientType} onValueChange={(v) => set("recipientType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Huésped</SelectItem>
                      <SelectItem value="owner">Propietario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Canal</Label>
                  <Select value={form.channel} onValueChange={(v) => set("channel", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Destinatario</Label>
                  <Select value={form.recipientId} onValueChange={(v) => set("recipientId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                    <SelectContent>
                      {recipients.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.firstName} {r.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Propiedad (opcional)</Label>
                  <Select value={form.propertyId} onValueChange={(v) => set("propertyId", v)}>
                    <SelectTrigger><SelectValue placeholder="Sin propiedad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin propiedad</SelectItem>
                      {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Plantilla (opcional)</Label>
                  <Select onValueChange={(v) => applyTemplate(v)}>
                    <SelectTrigger><SelectValue placeholder="Usar plantilla..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => <SelectItem key={t.label} value={t.body}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Asunto *</Label>
                  <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Asunto del mensaje" required />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Mensaje *</Label>
                    <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={generateAI} disabled={generating}>
                      <Sparkles className="h-3 w-3" />{generating ? "Mejorando..." : "Mejorar con IA"}
                    </Button>
                  </div>
                  <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={6} placeholder="Escribí el mensaje..." required />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pb-6">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-32">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : "Enviar mensaje"}
            </Button>
            <Button type="button" variant="outline">Guardar borrador</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/messages")}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
