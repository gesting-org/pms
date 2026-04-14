import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { Platform } from "@prisma/client";

const VALID_STATUSES = ["ACTIVE", "MAINTENANCE", "PAUSED", "INACTIVE"];
const VALID_PLATFORMS = ["AIRBNB", "BOOKING", "DIRECT", "OTHER"];

function buildPlatformsCreate(platforms: { platform: string; listingUrl: string }[]) {
  return platforms
    .filter((p) => VALID_PLATFORMS.includes(p.platform))
    .map((p) => ({
      platform: p.platform as Platform,
      listingUrl: p.listingUrl?.trim() || null,
      isActive: true,
    }));
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const properties = await prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, colorTag: true, status: true },
    });
    return NextResponse.json({ ok: true, data: properties });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { name, ownerId, address, city, province, description, bedrooms, bathrooms, maxGuests, commissionRate, status, colorTag, amenities, platforms } = body;

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });
    }
    if (!ownerId || typeof ownerId !== "string") {
      return NextResponse.json({ ok: false, error: "Propietario requerido" }, { status: 400 });
    }
    if (!address?.trim()) {
      return NextResponse.json({ ok: false, error: "Dirección requerida" }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }
    const commission = parseFloat(commissionRate ?? 20);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return NextResponse.json({ ok: false, error: "Comisión inválida (0-100)" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        name: name.trim(),
        ownerId,
        address: address.trim(),
        city: city?.trim() || "Buenos Aires",
        province: province?.trim() || null,
        description: description?.trim() || null,
        bedrooms: Math.max(0, parseInt(bedrooms) || 1),
        bathrooms: Math.max(0, parseInt(bathrooms) || 1),
        maxGuests: Math.max(1, parseInt(maxGuests) || 2),
        commissionRate: commission,
        status: VALID_STATUSES.includes(status) ? status : "ACTIVE",
        colorTag: /^#[0-9A-Fa-f]{6}$/.test(colorTag) ? colorTag : "#3B82F6",
        amenities: Array.isArray(amenities) ? amenities.filter((a) => typeof a === "string").map((a) => String(a).trim()) : [],
        platforms: platforms?.length
          ? { create: buildPlatformsCreate(platforms) }
          : undefined,
      },
    });

    return NextResponse.json({ ok: true, id: property.id });
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
    await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
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
    // Explicitly destructure allowed fields — never spread body directly into Prisma
    const { id, name, ownerId, address, city, province, description, bedrooms, bathrooms, maxGuests, commissionRate, status, colorTag, amenities, platforms } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name?.trim())       updateData.name = name.trim();
    if (ownerId)            updateData.ownerId = ownerId;
    if (address?.trim())    updateData.address = address.trim();
    if (city)               updateData.city = city.trim();
    if (province !== undefined) updateData.province = province?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (bedrooms !== undefined) updateData.bedrooms = Math.max(0, parseInt(bedrooms) || 0);
    if (bathrooms !== undefined) updateData.bathrooms = Math.max(0, parseInt(bathrooms) || 0);
    if (maxGuests !== undefined) updateData.maxGuests = Math.max(1, parseInt(maxGuests) || 1);
    if (commissionRate !== undefined) {
      const c = parseFloat(commissionRate);
      if (!isNaN(c) && c >= 0 && c <= 100) updateData.commissionRate = c;
    }
    if (status && VALID_STATUSES.includes(status)) updateData.status = status;
    if (colorTag && /^#[0-9A-Fa-f]{6}$/.test(colorTag)) updateData.colorTag = colorTag;
    if (Array.isArray(amenities)) {
      updateData.amenities = amenities.filter((a) => typeof a === "string").map((a) => String(a).trim());
    }
    if (platforms) {
      updateData.platforms = {
        deleteMany: {},
        create: buildPlatformsCreate(platforms),
      };
    }

    await prisma.property.update({ where: { id }, data: updateData });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
