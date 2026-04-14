import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

// Generates a readable default password: Gesting + last 4 digits of DNI
function defaultPassword(dni: string): string {
  const digits = dni.replace(/\D/g, "").slice(-4);
  return `Gesting${digits}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { ownerId } = await req.json();
    if (!ownerId) return NextResponse.json({ ok: false, error: "ownerId requerido" }, { status: 400 });

    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) return NextResponse.json({ ok: false, error: "Propietario no encontrado" }, { status: 404 });

    const plain = defaultPassword(owner.dni);
    const hashed = await bcrypt.hash(plain, 12);

    await prisma.owner.update({
      where: { id: ownerId },
      data: { portalPassword: hashed, mustChangePassword: true },
    });

    return NextResponse.json({ ok: true, password: plain });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
