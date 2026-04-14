import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signPortalToken, setPortalCookie } from "@/lib/portal-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ ok: false, error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const owner = await prisma.owner.findFirst({
      where: { email: email.trim().toLowerCase(), isActive: true },
    });

    if (!owner) {
      return NextResponse.json({ ok: false, error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    if (!owner.portalPassword) {
      return NextResponse.json({ ok: false, error: "Tu acceso no ha sido habilitado aún. Contactá a Gesting para obtener tus credenciales." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, owner.portalPassword);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const token = signPortalToken({
      ownerId: owner.id,
      email: owner.email,
      name: `${owner.firstName} ${owner.lastName}`,
      mustChangePassword: owner.mustChangePassword,
    });

    const res = NextResponse.json({ ok: true, mustChangePassword: owner.mustChangePassword });
    setPortalCookie(res, token);
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
