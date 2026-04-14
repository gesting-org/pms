import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export interface GuestOrderRow {
  id: string;
  bookingCode: string;
  guestName: string;
  propertyName: string;
  checkinDate: string; // ISO date string
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceARS: number;
  }>;
  notes: string | null;
  totalARS: number;
  createdAt: string; // ISO timestamp string
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const rows = await prisma.$queryRaw<GuestOrderRow[]>`
      SELECT
        id::text,
        "bookingCode",
        "guestName",
        "propertyName",
        "checkinDate"::text,
        items,
        notes,
        "totalARS"::float8 AS "totalARS",
        "createdAt"::text AS "createdAt"
      FROM "GuestOrder"
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
