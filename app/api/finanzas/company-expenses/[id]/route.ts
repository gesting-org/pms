import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { serializeCompanyExpense } from "@/lib/db/finanzas-serialize";

const VALID_CATEGORIES = [
  "MARKETING", "SOFTWARE", "SALARY", "SUBSCRIPTION", "TOOLS", "HONORARIOS", "OFFICE", "OTHER",
];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const existing = await prisma.companyExpense.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Gasto no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { category, description, amount, date, notes } = body;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Categoría inválida" }, { status: 400 });
  }
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
    return NextResponse.json({ ok: false, error: "Monto inválido" }, { status: 400 });
  }

  const updated = await prisma.companyExpense.update({
    where: { id: params.id },
    data: {
      ...(category && { category }),
      ...(description && { description: description.trim() }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
  });

  return NextResponse.json({ ok: true, data: serializeCompanyExpense(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const existing = await prisma.companyExpense.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Gasto no encontrado" }, { status: 404 });
  }

  await prisma.companyExpense.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
