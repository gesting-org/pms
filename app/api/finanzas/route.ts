import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getFinancialData } from "@/lib/db/finanzas-queries";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const year = yearParam ? parseInt(yearParam) : undefined;
  const month = monthParam ? parseInt(monthParam) : undefined;

  try {
    const data = await getFinancialData(year, month);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[finanzas] GET error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener datos financieros" }, { status: 500 });
  }
}
