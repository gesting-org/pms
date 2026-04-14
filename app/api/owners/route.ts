import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const owners = await prisma.owner.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, dni: true },
    });
    return NextResponse.json({ ok: true, data: owners });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { firstName, lastName, dni, cuit, email, phone, address, city, province, bankName, bankAccount, bankAlias } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ ok: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }
    if (!dni?.trim()) {
      return NextResponse.json({ ok: false, error: "DNI requerido" }, { status: 400 });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    const owner = await prisma.owner.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        cuit: cuit?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankAlias: bankAlias?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, id: owner.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });

    const now = new Date();

    // Find properties owned by this owner
    const properties = await prisma.property.findMany({
      where: { ownerId: id, deletedAt: null },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    // Soft-delete all properties
    if (propertyIds.length > 0) {
      await prisma.property.updateMany({
        where: { id: { in: propertyIds } },
        data: { deletedAt: now },
      });

      // Hard-delete tasks linked to those properties (no deletedAt on Task)
      await prisma.task.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
    }

    // Terminate all contracts of this owner
    await prisma.managementContract.updateMany({
      where: { ownerId: id, status: { not: "TERMINATED" } },
      data: { status: "TERMINATED" },
    });

    // Soft-delete the owner
    await prisma.owner.update({ where: { id }, data: { deletedAt: now } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { id, firstName, lastName, dni, cuit, email, phone, address, city, province, bankName, bankAccount, bankAlias } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ ok: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    await prisma.owner.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni?.trim(),
        cuit: cuit?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        bankAlias: bankAlias?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
