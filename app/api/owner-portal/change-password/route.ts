import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePortalSession, signPortalToken, setPortalCookie } from "@/lib/portal-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = requirePortalSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const owner = await prisma.owner.findUnique({ where: { id: session.ownerId } });
    if (!owner || !owner.portalPassword) {
      return NextResponse.json({ ok: false, error: "Propietario no encontrado" }, { status: 404 });
    }

    // If not first-change, validate current password
    if (!session.mustChangePassword) {
      if (!currentPassword) {
        return NextResponse.json({ ok: false, error: "Contraseña actual requerida" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, owner.portalPassword);
      if (!valid) {
        return NextResponse.json({ ok: false, error: "Contraseña actual incorrecta" }, { status: 401 });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.owner.update({
      where: { id: session.ownerId },
      data: { portalPassword: hashed, mustChangePassword: false },
    });

    // Re-issue token with mustChangePassword: false
    const newToken = signPortalToken({
      ...session,
      mustChangePassword: false,
    });

    const res = NextResponse.json({ ok: true });
    setPortalCookie(res, newToken);
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
