"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Property, Owner } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Sparkles, FileText, ChevronLeft, Loader2, Check, Download, Pen } from "lucide-react";
import Link from "next/link";

interface ContractGeneratorProps {
  properties: Property[];
  owners: Owner[];
  defaultPropertyId?: string;
}

const STEPS = ["Datos", "Generar", "Revisar", "Firmar"];

export function ContractGenerator({ properties, owners, defaultPropertyId }: ContractGeneratorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedText, setGeneratedText] = useState("");

  const [form, setForm] = useState({
    propertyId: defaultPropertyId ?? "",
    durationMonths: 12,
    commissionRate: 20,
    insuranceMinAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    additionalClauses: "",
    gestingRepName: "",
    gestingRepDni: "",
    gestingCuit: "",
    gestingAddress: "",
  });

  // Load Gesting config from DB
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(({ data }) => {
      if (!data) return;
      setForm((f) => ({
        ...f,
        gestingRepName: data.representative ?? "",
        gestingRepDni: data.representativeDni ?? "",
        gestingCuit: data.cuit ?? "",
        gestingAddress: `${data.address ?? ""}${data.city ? `, ${data.city}` : ""}`,
        commissionRate: data.defaultCommission ? parseFloat(data.defaultCommission) : f.commissionRate,
      }));
    }).catch(() => {});
  }, []);

  const selectedProperty = properties.find((p) => p.id === form.propertyId);
  const selectedOwner = owners.find((o) => o.id === selectedProperty?.ownerId);

  function set(key: string, val: any) { setForm((f) => ({ ...f, [key]: val })); }

  async function generateContract() {
    if (!selectedProperty || !selectedOwner) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerFullName: `${selectedOwner.firstName} ${selectedOwner.lastName}`,
          ownerDni: selectedOwner.dni,
          ownerCuit: selectedOwner.cuit,
          ownerAddress: selectedOwner.address ?? "",
          gestingRepName: form.gestingRepName,
          gestingRepDni: form.gestingRepDni,
          gestingCuit: form.gestingCuit,
          gestingAddress: form.gestingAddress,
          propertyAddress: `${selectedProperty.address}, ${selectedProperty.city}`,
          city: selectedProperty.city,
          durationMonths: form.durationMonths,
          commissionRate: form.commissionRate,
          insuranceMinAmount: form.insuranceMinAmount ? parseFloat(form.insuranceMinAmount) : undefined,
          startDate: formatDate(form.startDate),
          additionalClauses: form.additionalClauses || undefined,
        }),
      });

      if (!res.ok) throw new Error("Error generando contrato");
      const data = await res.json();
      setGeneratedText(data.text);
      setStep(2);
    } catch (err) {
      // Mock fallback cuando no hay API key
      setGeneratedText(getMockContractText(form, selectedProperty, selectedOwner));
      setStep(2);
    } finally {
      setGenerating(false);
    }
  }

  async function signContract() {
    if (!selectedProperty || !selectedOwner) return;
    setSaving(true);
    try {
      const startDate = new Date(form.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + form.durationMonths);

      // Generate contract number
      const contractNumber = `GEST-${startDate.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: form.propertyId,
          ownerId: selectedOwner.id,
          contractNumber,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          durationMonths: form.durationMonths,
          commissionRate: form.commissionRate,
          city: selectedProperty.city,
          ownerFullName: `${selectedOwner.firstName} ${selectedOwner.lastName}`,
          ownerDni: selectedOwner.dni,
          ownerCuit: selectedOwner.cuit ?? "",
          ownerAddress: selectedOwner.address ?? "",
          gestingRepName: form.gestingRepName,
          gestingRepDni: form.gestingRepDni,
          gestingCuit: form.gestingCuit,
          gestingAddress: form.gestingAddress,
          propertyAddress: `${selectedProperty.address}, ${selectedProperty.city}`,
          contractText: generatedText,
          status: "ACTIVE",
          signedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Error al guardar");
      toast({ title: "Contrato firmado y guardado", description: "El contrato está ahora vigente." });
      router.push("/contracts");
    } catch (err: any) {
      toast({ title: err.message ?? "Error", variant: "destructive" });
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a contratos
      </Link>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${i < step ? "bg-primary text-white" : i === step ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Datos */}
      {step === 0 && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Datos del contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Propiedad *</Label>
                  <Select value={form.propertyId} onValueChange={(v) => set("propertyId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná propiedad" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.address}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOwner && (
                    <p className="text-xs text-muted-foreground">
                      Propietario: <span className="font-medium">{selectedOwner.firstName} {selectedOwner.lastName}</span> · DNI {selectedOwner.dni}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de inicio</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración (meses)</Label>
                  <Input type="number" min={1} max={60} value={form.durationMonths} onChange={(e) => set("durationMonths", parseInt(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Comisión Gesting (%)</Label>
                  <Input type="number" min={0} max={100} step={0.5} value={form.commissionRate} onChange={(e) => set("commissionRate", parseFloat(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Seguro mínimo (ARS)</Label>
                  <Input type="number" min={0} step={100000} placeholder="Ej: 5000000" value={form.insuranceMinAmount} onChange={(e) => set("insuranceMinAmount", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos de Gesting (representante)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Representante</Label><Input value={form.gestingRepName} onChange={(e) => set("gestingRepName", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>DNI representante</Label><Input value={form.gestingRepDni} onChange={(e) => set("gestingRepDni", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>CUIT Gesting</Label><Input value={form.gestingCuit} onChange={(e) => set("gestingCuit", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Domicilio Gesting</Label><Input value={form.gestingAddress} onChange={(e) => set("gestingAddress", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Cláusulas adicionales (opcional)</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Agregá cláusulas especiales para este contrato..."
                value={form.additionalClauses}
                onChange={(e) => set("additionalClauses", e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <Button
            onClick={() => setStep(1)}
            disabled={!form.propertyId}
            className="w-full sm:w-auto"
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Step 1: Generar con IA */}
      {step === 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Generar contrato con IA</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Claude completará las 18 cláusulas del contrato con los datos que ingresaste,
                respetando el lenguaje legal y la estructura estándar de Gesting.
              </p>
            </div>
            {selectedProperty && selectedOwner && (
              <div className="inline-flex flex-col gap-1 text-left rounded-lg bg-muted px-4 py-3 text-sm">
                <span><span className="text-muted-foreground">Propiedad:</span> {selectedProperty.name}</span>
                <span><span className="text-muted-foreground">Propietario:</span> {selectedOwner.firstName} {selectedOwner.lastName}</span>
                <span><span className="text-muted-foreground">Duración:</span> {form.durationMonths} meses · Comisión {form.commissionRate}%</span>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
              <Button onClick={generateContract} disabled={generating} className="min-w-36">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4" />Generar contrato</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Revisar */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Contrato generado</CardTitle>
                <Badge variant="success">Listo para revisar</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={24}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2">Podés editar el texto antes de firmar.</p>
            </CardContent>
          </Card>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setStep(3)} className="flex-1 sm:flex-none">
              <Pen className="h-4 w-4" />Proceder a firma
            </Button>
            <Button variant="outline" onClick={() => setStep(1)}>Regenerar</Button>
            <Button variant="outline"><Download className="h-4 w-4" />Descargar PDF</Button>
          </div>
        </div>
      )}

      {/* Step 3: Firma */}
      {step === 3 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
              <Pen className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Confirmar firma del contrato</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Al confirmar, se registrará la firma digital con fecha y hora actual.
                El contrato quedará en estado <strong>Vigente</strong>.
              </p>
            </div>
            <div className="rounded-lg border p-4 text-sm text-left space-y-1 max-w-sm mx-auto">
              <p className="font-semibold">Resumen del contrato</p>
              <p className="text-muted-foreground">Propiedad: {selectedProperty?.name}</p>
              <p className="text-muted-foreground">Propietario: {selectedOwner?.firstName} {selectedOwner?.lastName}</p>
              <p className="text-muted-foreground">Duración: {form.durationMonths} meses desde {formatDate(form.startDate)}</p>
              <p className="text-muted-foreground">Comisión: {form.commissionRate}%</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button onClick={signContract} disabled={saving} className="min-w-36 bg-emerald-600 hover:bg-emerald-700">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Firmando...</> : <><Check className="h-4 w-4" />Firmar y guardar</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mock fallback cuando no hay API key configurada
function getMockContractText(form: any, property: Property, owner: Owner): string {
  const endDate = new Date(form.startDate);
  endDate.setMonth(endDate.getMonth() + form.durationMonths);

  return `CONTRATO DE GESTIÓN DE ALQUILER TEMPORARIO

En la ciudad de ${property.city}, a los ${new Date(form.startDate).getDate()} días del mes de ${new Date(form.startDate).toLocaleString("es-AR", { month: "long" })} de ${new Date(form.startDate).getFullYear()}, entre:

EL PROPIETARIO: ${owner.firstName} ${owner.lastName}, DNI ${owner.dni}${owner.cuit ? `, CUIT ${owner.cuit}` : ""}, con domicilio en ${owner.address ?? "[domicilio]"}, en adelante "EL PROPIETARIO";

y

LA GESTORA: Gesting PMS, representada por ${form.gestingRepName}, DNI ${form.gestingRepDni}, CUIT ${form.gestingCuit}, con domicilio en ${form.gestingAddress}, en adelante "GESTING";

convienen celebrar el presente CONTRATO DE GESTIÓN, sujeto a las siguientes cláusulas:

CLÁUSULA PRIMERA — OBJETO
GESTING se obliga a gestionar, comercializar y administrar operativamente el inmueble ubicado en ${property.address}, ${property.city}, de propiedad de EL PROPIETARIO, destinado al alquiler temporario.

CLÁUSULA SEGUNDA — DURACIÓN
El presente contrato tendrá una duración de ${form.durationMonths} (${form.durationMonths}) meses a partir del ${formatDate(form.startDate)}, finalizando el ${formatDate(endDate.toISOString())}. Se renovará automáticamente por períodos iguales salvo comunicación fehaciente con 30 días de anticipación.

CLÁUSULA TERCERA — EXCLUSIVIDAD
La gestión conferida a GESTING es de carácter EXCLUSIVO. EL PROPIETARIO no podrá comercializar el inmueble por ningún medio ni plataforma sin intervención de GESTING. El incumplimiento dará lugar a una penalidad equivalente a 3 (tres) meses de comisión promedio.

CLÁUSULA CUARTA — SERVICIOS DE GESTING
GESTING prestará los siguientes servicios: publicación en plataformas, gestión de precios, administración de reservas, coordinación de check-in/check-out, limpieza y mantenimiento, comunicación con huéspedes, reclamos y asistencia administrativa.

CLÁUSULA QUINTA — COMERCIALIZACIÓN
GESTING tendrá plena libertad para fijar precios, condiciones y seleccionar las plataformas de comercialización más convenientes para maximizar la rentabilidad del inmueble.

CLÁUSULA SEXTA — COMISIÓN
EL PROPIETARIO abonará a GESTING una comisión del ${form.commissionRate}% (${form.commissionRate} por ciento) sobre los ingresos brutos por alojamiento, excluidos impuestos y cargos de plataforma. La liquidación se realizará dentro de los primeros 5 (cinco) días hábiles del mes siguiente. La mora devengará un interés punitorio del 10% (diez por ciento) por cada día de retraso sobre el monto de los honorarios del mes.

CLÁUSULA SÉPTIMA — GASTOS OPERATIVOS
Los gastos operativos del inmueble (limpieza, lavandería, insumos, servicios, mantenimiento) corren por cuenta de EL PROPIETARIO. GESTING podrá adelantar gastos urgentes con comprobantes respaldatorios, los que serán reintegrados en la próxima liquidación.

CLÁUSULA OCTAVA — RESPONSABILIDAD SOBRE EL INMUEBLE
EL PROPIETARIO garantiza que el inmueble reúne las condiciones de habitabilidad, seguridad y autorizaciones legales necesarias para su explotación turística.

CLÁUSULA NOVENA — SEGURO
EL PROPIETARIO deberá mantener vigente un seguro de responsabilidad civil contra terceros${form.insuranceMinAmount ? ` por un monto mínimo de $${parseFloat(form.insuranceMinAmount).toLocaleString("es-AR")}` : ""} durante toda la vigencia del contrato.

CLÁUSULA DÉCIMA — DAÑOS POR HUÉSPEDES
GESTING gestionará ante las plataformas y/o huéspedes los reclamos por daños al inmueble, pero no garantiza la efectiva recuperación de los montos reclamados.

CLÁUSULA UNDÉCIMA — LIMITACIÓN DE RESPONSABILIDAD
GESTING no será responsable por cancelaciones de reservas, decisiones unilaterales de plataformas, fluctuaciones de demanda ni eventos de fuerza mayor que afecten la ocupación del inmueble.

CLÁUSULA DUODÉCIMA — RESCISIÓN
Cualquiera de las partes podrá rescindir el presente contrato mediante notificación fehaciente con 30 (treinta) días de anticipación. Las reservas confirmadas deberán ser respetadas hasta su vencimiento.

CLÁUSULA DÉCIMOTERCERA — CONFIDENCIALIDAD
EL PROPIETARIO se compromete a mantener la más estricta confidencialidad sobre estrategias comerciales, precios, datos de huéspedes y demás información de carácter reservado de GESTING.

CLÁUSULA DÉCIMOCUARTA — IMPUESTOS
Cada parte tributará sobre sus respectivos ingresos de conformidad con la normativa fiscal vigente, siendo responsable en forma independiente de sus obligaciones impositivas.

CLÁUSULA DÉCIMOQUINTA — CLÁUSULA DE INDEMNIDAD
EL PROPIETARIO mantendrá indemne a GESTING frente a cualquier reclamo, demanda o responsabilidad que surgiere de las condiciones físicas, legales o reglamentarias del inmueble.

CLÁUSULA DÉCIMOSEXTA — PROHIBICIÓN DE CAPTACIÓN DE HUÉSPEDES
Durante la vigencia del contrato y por 12 (doce) meses posteriores a su finalización, EL PROPIETARIO no podrá contactar, contratar ni comercializar directamente con huéspedes gestionados por GESTING. El incumplimiento generará una penalidad de 5 (cinco) veces la comisión promedio mensual.

CLÁUSULA DÉCIMOSÉPTIMA — JURISDICCIÓN
Para todos los efectos legales del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la ciudad de ${property.city}, renunciando a cualquier otro fuero.

CLÁUSULA DÉCIMOCTAVA — MISCELÁNEAS
El presente contrato constituye el acuerdo integral entre las partes. Ninguna tolerancia o demora en el ejercicio de un derecho implicará renuncia al mismo. Toda modificación deberá constar por escrito y ser suscripta por ambas partes.

${form.additionalClauses ? `\nCLÁUSULAS ADICIONALES\n${form.additionalClauses}\n` : ""}

En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto.

_______________________________          _______________________________
EL PROPIETARIO                           GESTING PMS
${owner.firstName} ${owner.lastName}                      ${form.gestingRepName}
DNI ${owner.dni}                              DNI ${form.gestingRepDni}
`;
}
