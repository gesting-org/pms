import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

const VALID_TYPES = ["CLEANING", "MAINTENANCE", "REPAIR", "INSPECTION", "CHECKIN", "CHECKOUT", "OTHER"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { propertyId, reservationId, type, title, description, priority, scheduledDate, estimatedCost, provider } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ ok: false, error: "propertyId requerido" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ ok: false, error: "Título requerido" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ ok: false, error: "Tipo de tarea inválido" }, { status: 400 });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ ok: false, error: "Prioridad inválida" }, { status: 400 });
    }
    const scheduledDateParsed = new Date(scheduledDate);
    if (isNaN(scheduledDateParsed.getTime())) {
      return NextResponse.json({ ok: false, error: "Fecha inválida" }, { status: 400 });
    }
    const cost = estimatedCost ? parseFloat(estimatedCost) : null;
    if (cost !== null && (isNaN(cost) || cost < 0)) {
      return NextResponse.json({ ok: false, error: "Costo estimado inválido" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        propertyId,
        reservationId: reservationId || null,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        scheduledDate: scheduledDateParsed,
        estimatedCost: cost,
        provider: provider?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, id: task.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
