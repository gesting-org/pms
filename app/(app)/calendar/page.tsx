import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { CalendarView } from "./components/calendar-view";

export const metadata = { title: "Calendario" };

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

export default async function CalendarPage() {
  const [reservations, tasks, contracts, properties] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { property: true, guest: true },
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { property: true },
    }),
    prisma.managementContract.findMany({
      where: { status: "EXPIRING_SOON" },
      include: { property: true },
    }),
    prisma.property.findMany({ orderBy: { name: "asc" } }),
  ]);

  const events = [
    ...reservations.map((r) => ({
      id: r.id,
      type: "reservation" as const,
      title: `${r.guest.firstName} ${r.guest.lastName}`,
      subtitle: r.property.name,
      start: toDateStr(r.checkIn),
      startTime: "14:00",
      end: toDateStr(r.checkOut),
      endTime: "10:00",
      color: r.property.colorTag,
      propertyId: r.propertyId,
      status: r.status,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      subtitle: t.property.name,
      start: toDateStr(t.scheduledDate),
      end: toDateStr(t.scheduledDate),
      color: "#94a3b8",
      propertyId: t.propertyId,
      status: t.status,
      priority: t.priority,
    })),
    ...contracts.map((c) => ({
      id: c.id,
      type: "contract" as const,
      title: `Vence contrato: ${c.property.name}`,
      subtitle: c.ownerFullName,
      start: toDateStr(c.endDate),
      end: toDateStr(c.endDate),
      color: "#f59e0b",
      propertyId: c.propertyId,
      status: c.status,
    })),
  ];

  const serializedProperties = properties.map((p) => ({
    id: p.id,
    name: p.name,
    colorTag: p.colorTag,
    status: p.status,
    address: p.address,
    city: p.city,
    province: p.province,
    ownerId: p.ownerId,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    maxGuests: p.maxGuests,
    amenities: p.amenities,
    platforms: [] as any[],
    commissionRate: parseFloat(String(p.commissionRate)),
    cleaningFee: 0,
    nightlyRate: 0,
    createdAt: toDateStr(p.createdAt),
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Calendario" subtitle="Vista multi-propiedad" />
      <div className="p-4 md:p-6 animate-fade-in">
        <CalendarView events={events} properties={serializedProperties as any} />
      </div>
    </div>
  );
}
