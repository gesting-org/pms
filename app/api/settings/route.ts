import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

const CONFIG_ID = "default";

export async function GET() {
  try {
    const config = await prisma.gestingConfig.findUnique({ where: { id: CONFIG_ID } });
    return NextResponse.json({ ok: true, data: config });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    // Never allow overwriting the id
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;

    // Convert numeric strings to proper types
    if (body.defaultCommission !== undefined) body.defaultCommission = parseFloat(body.defaultCommission);
    if (body.lateFeeRate !== undefined) body.lateFeeRate = parseFloat(body.lateFeeRate);
    if (body.liquidationDueDay !== undefined) body.liquidationDueDay = parseInt(body.liquidationDueDay);

    const config = await prisma.gestingConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, ...body },
      update: body,
    });

    return NextResponse.json({ ok: true, data: config });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
