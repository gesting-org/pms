import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeProperty, serializeGuest } from "@/lib/db/serialize";
import { ReservationForm } from "../components/reservation-form";

export const metadata = { title: "Nueva reserva" };

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: { propertyId?: string };
}) {
  const [rawProperties, rawGuests] = await Promise.all([
    prisma.property.findMany({ orderBy: { name: "asc" }, include: { platforms: true } }),
    prisma.guest.findMany({ orderBy: { lastName: "asc" } }),
  ]);

  const properties = rawProperties.map((p) => serializeProperty(p as any));
  const guests = rawGuests.map((g) => serializeGuest(g));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nueva reserva" subtitle="Carga manual de reserva" />
      <div className="p-4 md:p-6 max-w-2xl animate-fade-in">
        <ReservationForm
          properties={properties as any}
          guests={guests as any}
          defaultPropertyId={searchParams.propertyId}
        />
      </div>
    </div>
  );
}
