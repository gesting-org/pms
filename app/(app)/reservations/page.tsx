export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { getReservations } from "@/lib/db/queries";
import { serializeReservation } from "@/lib/db/serialize";
import { ReservationsList } from "./components/reservations-list";

export const metadata = { title: "Reservas" };

export default async function ReservationsPage() {
  const rawReservations = await getReservations();
  const reservations = rawReservations.map((r) => serializeReservation(r as any));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Reservas" subtitle={`${reservations.length} reservas totales`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <ReservationsList reservations={reservations as any} />
      </div>
    </div>
  );
}
