import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

const VALID_CATEGORIES = ["CLEANING", "MAINTENANCE", "REPAIR", "SUPPLIES", "UTILITIES", "TAXES", "INSURANCE", "MANAGEMENT", "OTHER"];
const VALID_STATUSES = ["ADVANCED_BY_GESTING", "PAID_BY_OWNER", "REIMBURSED"];

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { propertyId, category, description, amount, date, status, notes } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ ok: false, error: "propertyId requerido" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ ok: false, error: "Descripción requerida" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ ok: false, error: "Categoría inválida" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return NextResponse.json({ ok: false, error: "Monto inválido" }, { status: 400 });
    }
    const dateParsed = new Date(date);
    if (isNaN(dateParsed.getTime())) {
      return NextResponse.json({ ok: false, error: "Fecha inválida" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId,
        category,
        description: description.trim(),
        amount: amountNum,
        date: dateParsed,
        status,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, id: expense.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
