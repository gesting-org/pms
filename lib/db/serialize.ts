/**
 * Converts Prisma DB objects to plain JS objects compatible with existing
 * component props (Dates → ISO strings, Decimal → number).
 */

import type {
  Owner as PrismaOwner,
  Property as PrismaProperty,
  PropertyPlatform as PrismaPlatform,
  Guest as PrismaGuest,
  Reservation as PrismaReservation,
  Task as PrismaTask,
  Expense as PrismaExpense,
  Liquidation as PrismaLiquidation,
  ManagementContract as PrismaContract,
  Message as PrismaMessage,
} from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v));
}

// ─── Owner ────────────────────────────────────────────────────────────────────

export function serializeOwner(o: PrismaOwner) {
  return {
    id: o.id,
    firstName: o.firstName,
    lastName: o.lastName,
    dni: o.dni,
    cuit: o.cuit ?? undefined,
    email: o.email,
    phone: o.phone ?? undefined,
    address: o.address ?? undefined,
    city: o.city ?? undefined,
    province: o.province ?? undefined,
    bankName: o.bankName ?? undefined,
    bankAccount: o.bankAccount ?? undefined,
    bankAlias: o.bankAlias ?? undefined,
    portalToken: o.portalToken ?? null,
    portalTokenExp: o.portalTokenExp ? toDateStr(o.portalTokenExp) : null,
    portalPassword: o.portalPassword ? "set" : null, // never expose hash — just signal
    mustChangePassword: o.mustChangePassword,
    isActive: o.isActive,
    createdAt: toDateStr(o.createdAt),
  };
}

// ─── Platform ─────────────────────────────────────────────────────────────────

export function serializePlatform(pl: PrismaPlatform) {
  return {
    id: pl.id,
    platform: pl.platform as string,
    listingUrl: pl.listingUrl ?? undefined,
    externalId: pl.listingId ?? undefined,
    isActive: pl.isActive,
  };
}

// ─── Property ─────────────────────────────────────────────────────────────────

export function serializeProperty(
  p: PrismaProperty & { owner?: PrismaOwner; platforms?: PrismaPlatform[] }
) {
  return {
    id: p.id,
    ownerId: p.ownerId,
    name: p.name,
    address: p.address,
    city: p.city,
    province: p.province,
    description: p.description ?? undefined,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    maxGuests: p.maxGuests,
    amenities: p.amenities,
    platforms: (p.platforms ?? []).map(serializePlatform),
    status: p.status as string,
    colorTag: p.colorTag,
    commissionRate: toNum(p.commissionRate),
    cleaningFee: 0,    // not in schema, default 0
    nightlyRate: 0,    // not in schema, default 0
    createdAt: toDateStr(p.createdAt),
    owner: p.owner ? serializeOwner(p.owner) : undefined,
  };
}

// ─── Guest ────────────────────────────────────────────────────────────────────

export function serializeGuest(g: PrismaGuest) {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email ?? "",
    phone: g.phone ?? undefined,
    nationality: g.nationality ?? undefined,
    dni: g.dni ?? undefined,
    notes: g.notes ?? undefined,
    createdAt: toDateStr(g.createdAt),
  };
}

// ─── Reservation ──────────────────────────────────────────────────────────────

export function serializeReservation(
  r: PrismaReservation & { property?: PrismaProperty; guest?: PrismaGuest }
) {
  return {
    id: r.id,
    propertyId: r.propertyId,
    guestId: r.guestId,
    platform: r.platform as string,
    externalId: r.externalId ?? undefined,
    bookingCode: (r as any).bookingCode ?? null,
    checkIn: toDateStr(r.checkIn),
    checkInTime: (r as any).checkInTime ?? "14:00",
    checkOut: toDateStr(r.checkOut),
    checkOutTime: (r as any).checkOutTime ?? "10:00",
    nights: r.nights,
    adults: 2,
    children: 0,
    grossAmount: toNum(r.grossAmount),
    platformFee: toNum(r.platformFee),
    netAmount: toNum(r.netAmount),
    cleaningFee: 0,
    commissionAmount: Math.round(toNum(r.netAmount) * 0.20),
    netToOwner: Math.round(toNum(r.netAmount) * 0.80),
    status: r.status as string,
    notes: r.notes ?? undefined,
    createdAt: toDateStr(r.createdAt),
    property: r.property ? serializeProperty(r.property as any) : undefined,
    guest: r.guest ? serializeGuest(r.guest) : undefined,
  };
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export function serializeTask(
  t: PrismaTask & { property?: PrismaProperty }
) {
  return {
    id: t.id,
    propertyId: t.propertyId,
    reservationId: t.reservationId ?? undefined,
    type: t.type as string,
    title: t.title,
    description: t.description ?? undefined,
    priority: t.priority as string,
    scheduledDate: toDateStr(t.scheduledDate),
    completedAt: t.completedAt ? toDateStr(t.completedAt) : undefined,
    estimatedCost: t.estimatedCost ? toNum(t.estimatedCost) : undefined,
    actualCost: t.actualCost ? toNum(t.actualCost) : undefined,
    provider: t.provider ?? undefined,
    status: t.status as string,
    createdAt: toDateStr(t.createdAt),
    property: t.property ? serializeProperty(t.property as any) : undefined,
  };
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export function serializeExpense(
  e: PrismaExpense & { property?: PrismaProperty }
) {
  return {
    id: e.id,
    propertyId: e.propertyId,
    liquidationId: e.liquidationId ?? undefined,
    category: e.category as string,
    description: e.description,
    amount: toNum(e.amount),
    date: toDateStr(e.date),
    receiptUrl: e.receiptUrl ?? undefined,
    status: e.status as string,
    notes: e.notes ?? undefined,
    createdAt: toDateStr(e.createdAt),
    property: e.property ? serializeProperty(e.property as any) : undefined,
  };
}

// ─── Liquidation ──────────────────────────────────────────────────────────────

type LiquidationWithRel = PrismaLiquidation & {
  property?: PrismaProperty & { owner?: PrismaOwner };
};

export function serializeLiquidation(l: LiquidationWithRel) {
  return {
    id: l.id,
    propertyId: l.propertyId,
    ownerId: l.property?.ownerId ?? "",
    periodLabel: l.periodLabel,
    periodYear: l.periodYear,
    periodMonth: l.periodMonth,
    reservationIds: [] as string[],
    grossRevenue: toNum(l.grossIncome),
    grossIncome: toNum(l.grossIncome),
    totalExpenses: toNum(l.operationalExpenses),
    operationalExpenses: toNum(l.operationalExpenses),
    commissionAmount: toNum(l.commissionAmount),
    commissionRate: toNum(l.commissionRate),
    netToOwner: toNum(l.netToOwner),
    totalDue: toNum(l.totalDue),
    dueDate: toDateStr(l.dueDate),
    paidDate: l.paidAt ? toDateStr(l.paidAt) : undefined,
    status: l.status as string,
    notes: l.notes ?? undefined,
    invoiceUrl: l.invoiceUrl ?? undefined,
    invoiceFileName: l.invoiceFileName ?? undefined,
    createdAt: toDateStr(l.createdAt),
    property: l.property ? serializeProperty(l.property as any) : undefined,
    owner: l.property?.owner ? serializeOwner(l.property.owner) : undefined,
  };
}

// ─── ManagementContract ───────────────────────────────────────────────────────

type ContractWithRel = PrismaContract & {
  property?: PrismaProperty;
  owner?: PrismaOwner;
};

export function serializeContract(c: ContractWithRel) {
  return {
    id: c.id,
    propertyId: c.propertyId,
    ownerId: c.ownerId,
    ownerFullName: c.ownerFullName,
    ownerDni: c.ownerDni,
    ownerCuit: c.ownerCuit ?? undefined,
    ownerAddress: c.ownerAddress,
    propertyAddress: c.propertyAddress,
    commissionRate: toNum(c.commissionRate),
    startDate: toDateStr(c.startDate),
    endDate: toDateStr(c.endDate),
    durationMonths: c.durationMonths,
    city: c.city,
    gestingRepName: c.gestingRepName,
    contractNumber: c.contractNumber,
    specialClauses: c.additionalClauses ?? undefined,
    status: c.status as string,
    signedAt: c.signedAt ? toDateStr(c.signedAt) : undefined,
    createdAt: toDateStr(c.createdAt),
    property: c.property ? serializeProperty(c.property as any) : undefined,
    owner: c.owner ? serializeOwner(c.owner) : undefined,
  };
}

// ─── Message ──────────────────────────────────────────────────────────────────

type MessageWithRel = PrismaMessage & {
  guest?: PrismaGuest | null;
  property?: PrismaProperty | null;
};

export function serializeMessage(m: MessageWithRel) {
  return {
    id: m.id,
    guestId: m.guestId ?? undefined,
    reservationId: m.reservationId ?? undefined,
    propertyId: m.propertyId ?? undefined,
    ownerId: m.ownerId ?? undefined,
    direction: m.direction as string,
    channel: (m.channel === "INTERNAL" ? "EMAIL" : m.channel) as string,
    subject: m.subject ?? "",
    body: m.body,
    isRead: m.status === "READ",
    status: m.status as string,
    sentAt: m.sentAt ? m.sentAt.toISOString() : m.createdAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    guest: m.guest ? serializeGuest(m.guest) : undefined,
    property: m.property ? serializeProperty(m.property as any) : undefined,
  };
}
