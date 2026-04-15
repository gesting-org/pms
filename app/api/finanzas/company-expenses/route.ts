import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { serializeCompanyExpense } from "@/lib/db/finanzas-serialize";

const VALID_CATEGORIES = [
  "MARKETING", "SOFTWARE", "SALARY", "SUBSCRIPTION", "TOOLS", "HONORARIOS", "OFFICE", "OTHER",
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let where: any = {};
  if (yearParam && monthParam) {
    const y = parseInt(yearParam);
    const m = parseInt(monthParam);
    where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
  }

  const expenses = await prisma.companyExpense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json({ ok: true, data: expenses.map(serializeCompanyExpense) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { category, description, amount, date, notes } = body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Categoría inválida" }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ ok: false, error: "Descripción requerida" }, { status: 400 });
  }
  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
    return NextResponse.json({ ok: false, error: "Monto inválido" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ ok: false, error: "Fecha requerida" }, { status: 400 });
  }

  const expense = await prisma.companyExpense.create({
    data: {
      category,
      description: description.trim(),
      amount: Number(amount),
      date: new Date(date),
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, data: serializeCompanyExpense(expense) }, { status: 201 });
}
