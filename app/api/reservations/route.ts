import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { generateBookingCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");
    const reservations = await prisma.reservation.findMany({
      where: propertyId ? { propertyId } : undefined,
      orderBy: { checkIn: "desc" },
      include: { guest: true, property: true },
    });

    const data = reservations.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      platform: r.platform,
      checkIn: r.checkIn.toISOString().split("T")[0],
      checkOut: r.checkOut.toISOString().split("T")[0],
      nights: r.nights,
      grossAmount: parseFloat(String(r.grossAmount)),
      platformFee: parseFloat(String(r.platformFee)),
      netAmount: parseFloat(String(r.netAmount)),
      status: r.status,
      guest: r.guest ? { id: r.guest.id, firstName: r.guest.firstName, lastName: r.guest.lastName } : null,
      property: r.property ? { id: r.property.id, name: r.property.name } : null,
    }));

    return NextResponse.json({ ok: true, data });
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
      propertyId, guestId, platform, externalId,
      checkIn, checkOut, checkInTime, checkOutTime,
      grossAmount, platformFee, notes,
      newGuest, guestFirstName, guestLastName, guestEmail, guestPhone, guestNationality,
    } = body;

    // Input validation
    const VALID_PLATFORMS = ["AIRBNB", "BOOKING", "DIRECT", "OTHER"];
    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ ok: false, error: "propertyId requerido" }, { status: 400 });
    }
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ ok: false, error: "Plataforma inválida" }, { status: 400 });
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Fechas inválidas" }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ ok: false, error: "Check-out debe ser posterior al check-in" }, { status: 400 });
    }
    const grossNum = parseFloat(grossAmount);
    const feeNum = parseFloat(platformFee ?? 0);
    if (isNaN(grossNum) || grossNum < 0) {
      return NextResponse.json({ ok: false, error: "Monto bruto inválido" }, { status: 400 });
    }
    if (isNaN(feeNum) || feeNum < 0) {
      return NextResponse.json({ ok: false, error: "Cargo de plataforma inválido" }, { status: 400 });
    }
    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const netAmount = grossNum - feeNum;

    if (newGuest && (!guestFirstName?.trim() || !guestLastName?.trim())) {
      return NextResponse.json({ ok: false, error: "Nombre y apellido del huésped requeridos" }, { status: 400 });
    }
    if (!newGuest && (!guestId || typeof guestId !== "string")) {
      return NextResponse.json({ ok: false, error: "Huésped requerido" }, { status: 400 });
    }

    let resolvedGuestId = guestId;

    if (newGuest) {
      const created = await prisma.guest.create({
        data: {
          firstName: guestFirstName.trim(),
          lastName: guestLastName.trim(),
          email: guestEmail?.trim() || null,
          phone: guestPhone?.trim() || null,
          nationality: guestNationality?.trim() || null,
        },
      });
      resolvedGuestId = created.id;
    }

    // Generate a unique booking code (retry on collision, max 5 attempts)
    let bookingCode: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateBookingCode();
      const exists = await prisma.reservation.findUnique({
        where: { bookingCode: candidate },
        select: { id: true },
      });
      if (!exists) { bookingCode = candidate; break; }
    }

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestId: resolvedGuestId,
        platform,
        externalId: externalId?.trim() || null,
        bookingCode,
        checkInTime: checkInTime?.trim() || "14:00",
        checkOutTime: checkOutTime?.trim() || "10:00",
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        grossAmount: grossNum,
        platformFee: feeNum,
        netAmount,
        status: "CONFIRMED",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, id: reservation.id, bookingCode: reservation.bookingCode });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
