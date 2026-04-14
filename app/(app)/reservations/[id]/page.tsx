import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeReservation, serializeProperty, serializeGuest, serializeTask } from "@/lib/db/serialize";
import { ReservationDetail } from "../components/reservation-detail";

export default async function ReservationPage({ params }: { params: { id: string } }) {
  const raw = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      property: { include: { owner: true, platforms: true } },
      guest: true,
      tasks: true,
    },
  });
  if (!raw) notFound();

  const reservation = serializeReservation(raw as any);
  const property = serializeProperty(raw.property as any);
  const guest = serializeGuest(raw.guest);
  const tasks = raw.tasks.map((t) => serializeTask(t as any));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title={`${raw.guest.firstName} ${raw.guest.lastName}`}
        subtitle={`${raw.property.name} · ${raw.nights} noches`}
      />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <ReservationDetail reservation={reservation as any} property={property as any} guest={guest as any} tasks={tasks as any} />
      </div>
    </div>
  );
}
