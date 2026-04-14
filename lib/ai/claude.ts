import Anthropic from "@anthropic-ai/sdk";

const getClient = () =>
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-20250514";

// ─── Generador de contratos ───────────────────────────────────────────────────

export interface ContractFields {
  ownerFullName: string;
  ownerDni: string;
  ownerCuit?: string;
  ownerAddress: string;
  gestingRepName: string;
  gestingRepDni: string;
  gestingCuit: string;
  gestingAddress: string;
  propertyAddress: string;
  city: string;
  durationMonths: number;
  commissionRate: number;
  insuranceMinAmount?: number;
  startDate: string; // DD/MM/YYYY
  additionalClauses?: string;
}

export async function generateContract(fields: ContractFields): Promise<string> {
  const client = getClient();

  const prompt = `Eres un redactor legal especializado en contratos de gestión de alquileres temporarios en Argentina.

Genera el contrato de gestión completo con EXACTAMENTE estas 18 cláusulas, respetando el lenguaje legal y formal:

1. OBJETO — gestión, comercialización y administración operativa del inmueble
2. DURACIÓN — ${fields.durationMonths} meses, renovación automática, preaviso 30 días
3. EXCLUSIVIDAD — absoluta. Penalidad por incumplimiento: 3 meses de comisión promedio
4. SERVICIOS DE GESTING — publicación, precios, reservas, calendario, comunicación, check-in/out, limpieza, mantenimiento, reclamos, asistencia administrativa
5. COMERCIALIZACIÓN — libertad de precios y plataformas
6. COMISIÓN — ${fields.commissionRate}% sobre ingresos brutos por alojamiento (excluye impuestos y cargos de plataforma). Liquidación mensual primeros 5 días hábiles. Mora: 10% por día de retraso sobre honorarios del mes
7. GASTOS OPERATIVOS — a cargo del propietario: limpieza, lavandería, insumos, servicios, mantenimiento. Gesting puede adelantar gastos urgentes con comprobantes
8. RESPONSABILIDAD SOBRE EL INMUEBLE — propietario garantiza habitabilidad y autorizaciones
9. SEGURO — propietario debe contratar seguro de responsabilidad civil${fields.insuranceMinAmount ? ` por un mínimo de $${fields.insuranceMinAmount.toLocaleString("es-AR")}` : ""}
10. DAÑOS POR HUÉSPEDES — Gesting gestiona reclamos pero no garantiza recupero
11. LIMITACIÓN DE RESPONSABILIDAD — Gesting no responde por cancelaciones, decisiones de plataformas, fluctuaciones de demanda
12. RESCISIÓN — 30 días preaviso. Reservas confirmadas se respetan
13. CONFIDENCIALIDAD — propietario mantiene confidencialidad de estrategias y datos de huéspedes
14. IMPUESTOS — cada parte tributa por sus ingresos
15. CLÁUSULA DE INDEMNIDAD — propietario mantiene indemne a Gesting por condiciones del inmueble
16. PROHIBICIÓN CAPTACIÓN DE HUÉSPEDES — durante vigencia + 12 meses post-contrato. Penalidad: 5x comisión promedio mensual
17. JURISDICCIÓN — tribunales de ${fields.city}
18. MISCELÁNEAS — interpretación, modificaciones, tolerancias

DATOS A INSERTAR:
- Propietario: ${fields.ownerFullName}, DNI ${fields.ownerDni}${fields.ownerCuit ? `, CUIT ${fields.ownerCuit}` : ""}, domicilio: ${fields.ownerAddress}
- Gesting: representada por ${fields.gestingRepName}, DNI ${fields.gestingRepDni}, CUIT ${fields.gestingCuit}, domicilio: ${fields.gestingAddress}
- Inmueble: ${fields.propertyAddress}
- Ciudad: ${fields.city}
- Inicio: ${fields.startDate}
- Duración: ${fields.durationMonths} meses
- Comisión Gesting: ${fields.commissionRate}%

${fields.additionalClauses ? `CLÁUSULAS ADICIONALES AL FINAL:\n${fields.additionalClauses}` : ""}

Genera el contrato completo, formal y en español argentino. Incluye encabezado, datos de las partes, las 18 cláusulas numeradas con sus subtítulos en mayúsculas, y espacio para firmas al final. NO incluyas comentarios ni explicaciones fuera del texto del contrato.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Respuesta inesperada de Claude");
  return content.text;
}

// ─── Sugerencia de respuestas ─────────────────────────────────────────────────

export async function suggestReply(
  context: string,
  incomingMessage: string,
  recipientType: "guest" | "owner"
): Promise<string> {
  const client = getClient();

  const prompt = `Eres el asistente de Gesting PMS, empresa de gestión de alquileres temporarios en Argentina.

Contexto: ${context}

Mensaje recibido de ${recipientType === "guest" ? "huésped" : "propietario"}:
"${incomingMessage}"

Redacta una respuesta profesional, amable y concisa en español argentino (tuteo informal pero respetuoso).
La respuesta será revisada por el administrador antes de enviarse.
No incluyas saludos genéricos ni despedidas largas. Ve al punto.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Respuesta inesperada de Claude");
  return content.text;
}

// ─── Análisis de morosidad ────────────────────────────────────────────────────

export interface LiquidationHistory {
  period: string;
  amount: number;
  daysLate: number;
  paid: boolean;
}

export async function analyzeMorosidad(
  ownerName: string,
  propertyName: string,
  history: LiquidationHistory[]
): Promise<string> {
  const client = getClient();

  const historyText = history
    .map(
      (h) =>
        `- ${h.period}: $${h.amount.toLocaleString("es-AR")} — ${h.paid ? `pagado${h.daysLate > 0 ? ` con ${h.daysLate} días de retraso` : " en término"}` : "IMPAGO"}`
    )
    .join("\n");

  const prompt = `Sos analista de riesgo de Gesting PMS, empresa de gestión de alquileres temporarios.

Propietario: ${ownerName}
Propiedad: ${propertyName}

Historial de liquidaciones:
${historyText}

Genera un reporte breve de riesgo de morosidad que incluya:
1. Índice de puntualidad (porcentaje de pagos en término)
2. Promedio de días de retraso (si aplica)
3. Tendencia (mejorando / estable / empeorando)
4. Nivel de riesgo: BAJO / MEDIO / ALTO / CRÍTICO
5. Recomendación de acción concreta para Gesting

Responde en español argentino, de forma directa y profesional. Máximo 200 palabras.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Respuesta inesperada de Claude");
  return content.text;
}

// ─── Resumen mensual ejecutivo ────────────────────────────────────────────────

export interface MonthlyStats {
  month: string;
  totalReservations: number;
  totalGrossIncome: number;
  totalCommission: number;
  totalExpenses: number;
  occupancyRate: number;
  propertiesCount: number;
  topProperty: string;
  pendingTasks: number;
  overduePayments: number;
}

export async function generateMonthlySummary(stats: MonthlyStats): Promise<string> {
  const client = getClient();

  const prompt = `Sos el asistente ejecutivo de Gesting PMS, empresa de gestión de alquileres temporarios en Argentina.

Datos del mes de ${stats.month}:
- Reservas completadas: ${stats.totalReservations}
- Ingresos brutos totales: $${stats.totalGrossIncome.toLocaleString("es-AR")}
- Comisiones cobradas: $${stats.totalCommission.toLocaleString("es-AR")}
- Gastos operativos: $${stats.totalExpenses.toLocaleString("es-AR")}
- Ocupación promedio: ${stats.occupancyRate.toFixed(1)}%
- Propiedades activas: ${stats.propertiesCount}
- Propiedad más rentable: ${stats.topProperty}
- Tareas pendientes: ${stats.pendingTasks}
- Liquidaciones en mora: ${stats.overduePayments}

Redacta un resumen ejecutivo del mes en español argentino, fluido y profesional.
Destacá logros, alertas importantes y 2-3 recomendaciones de acción para el próximo mes.
Máximo 300 palabras. Formato: párrafos narrativos (no bullets).`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Respuesta inesperada de Claude");
  return content.text;
}
