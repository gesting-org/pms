import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });
    await prisma.managementContract.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      propertyId, ownerId, contractNumber, startDate, endDate,
      durationMonths, commissionRate, city,
      ownerFullName, ownerDni, ownerCuit, ownerAddress,
      gestingRepName, gestingRepDni, gestingCuit, gestingAddress,
      propertyAddress, contractText, status, signedAt,
    } = body;

    if (!propertyId || !ownerId || !contractNumber) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const contract = await prisma.managementContract.create({
      data: {
        propertyId, ownerId, contractNumber,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationMonths: parseInt(durationMonths),
        commissionRate: parseFloat(commissionRate),
        city: city ?? "Buenos Aires",
        ownerFullName, ownerDni,
        ownerCuit: ownerCuit ?? "",
        ownerAddress: ownerAddress ?? "",
        gestingRepName, gestingRepDni,
        gestingCuit: gestingCuit ?? "",
        gestingAddress: gestingAddress ?? "",
        propertyAddress,
        fullText: contractText ?? null,
        status: status ?? "ACTIVE",
        signedAt: signedAt ? new Date(signedAt) : new Date(),
      },
    });

    return NextResponse.json({ ok: true, id: contract.id });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Ya existe un contrato con ese número" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
