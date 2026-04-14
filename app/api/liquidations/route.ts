import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      propertyId, periodYear, periodMonth, periodLabel,
      grossIncome, platformFees, operationalExpenses,
      commissionRate, commissionAmount, netToOwner, totalDue, dueDate,
    } = body;

    if (!propertyId || !periodYear || !periodMonth) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const liquidation = await prisma.liquidation.create({
      data: {
        propertyId,
        periodYear,
        periodMonth,
        periodLabel,
        grossIncome,
        platformFees: platformFees ?? 0,
        operationalExpenses: operationalExpenses ?? 0,
        commissionRate,
        commissionAmount,
        netToOwner,
        totalDue,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, id: liquidation.id });
  } catch (err: any) {
    // Unique constraint = liquidation already exists for this period
    if (err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Ya existe una liquidación para este período y propiedad" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
