import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_ORIGIN = process.env.GUEST_SITE_ORIGIN ?? "*";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.trim().toUpperCase();

  if (!code || code.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Código inválido" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { bookingCode: code },
      select: {
        checkIn: true,
        checkOut: true,
        checkInTime: true,
        checkOutTime: true,
        nights: true,
        status: true,
        guest: {
          select: { firstName: true },
        },
        property: {
          select: { name: true, address: true, city: true },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: "Reserva no encontrada" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          guestFirstName: reservation.guest.firstName,
          checkIn: reservation.checkIn.toISOString().split("T")[0],
          checkOut: reservation.checkOut.toISOString().split("T")[0],
          checkInTime: reservation.checkInTime,
          checkOutTime: reservation.checkOutTime,
          nights: reservation.nights,
          status: reservation.status,
          property: reservation.property,
        },
      },
      { headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
