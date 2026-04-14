import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { status, paymentMethod, paymentReference, paidAt } = body;

    const data: Record<string, any> = {};
    if (status) data.status = status;
    if (paymentMethod) data.paymentMethod = paymentMethod;
    if (paymentReference) data.paymentReference = paymentReference;
    if (paidAt) data.paidAt = new Date(paidAt);
    else if (status === "PAID") data.paidAt = new Date();

    const liquidation = await prisma.liquidation.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ ok: true, id: liquidation.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await prisma.liquidation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
