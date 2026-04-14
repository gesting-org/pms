import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeProperty, serializeOwner, serializeReservation, serializeTask, serializeExpense, serializeLiquidation, serializeContract } from "@/lib/db/serialize";
import { PropertyDetail } from "../components/property-detail";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  return { title: property?.name ?? "Propiedad" };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const raw = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      platforms: true,
      reservations: { include: { guest: true }, orderBy: { checkIn: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      tasks: { orderBy: { scheduledDate: "asc" } },
      liquidations: { include: { property: { include: { owner: true } } }, orderBy: { periodYear: "desc" } },
      contracts: { include: { owner: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!raw) notFound();

  const property = serializeProperty(raw as any);
  const owner = serializeOwner(raw.owner);
  const reservations = raw.reservations.map((r) => serializeReservation(r as any));
  const tasks = raw.tasks.map((t) => serializeTask(t as any));
  const expenses = raw.expenses.map((e) => serializeExpense(e as any));
  const liquidations = raw.liquidations.map((l) => serializeLiquidation(l as any));
  const contract = raw.contracts.find((c) => c.status === "ACTIVE" || c.status === "EXPIRING_SOON");
  const serializedContract = contract ? serializeContract({ ...contract, property: raw as any }) : undefined;

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title={raw.name} subtitle={`${raw.address}, ${raw.city}`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <PropertyDetail
          property={property as any}
          owner={owner as any}
          reservations={reservations as any}
          tasks={tasks as any}
          expenses={expenses as any}
          liquidations={liquidations as any}
          contract={serializedContract as any}
        />
      </div>
    </div>
  );
}
