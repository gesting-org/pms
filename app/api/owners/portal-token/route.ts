import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { ownerId } = await req.json();
    if (!ownerId || typeof ownerId !== "string") {
      return NextResponse.json({ ok: false, error: "ownerId requerido" }, { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    // Token válido por 1 año
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);

    await prisma.owner.update({
      where: { id: ownerId },
      data: { portalToken: token, portalTokenExp: exp },
    });

    return NextResponse.json({ ok: true, token });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
