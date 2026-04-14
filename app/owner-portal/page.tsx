import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal-auth";
import { prisma } from "@/lib/db";
import {
  serializeOwner, serializeProperty, serializeContract,
  serializeReservation, serializeLiquidation, serializeExpense, serializeTask,
} from "@/lib/db/serialize";
import { OwnerPortalClient } from "./portal-client";

export default async function OwnerPortalPage() {
  const session = await getPortalSession();
  if (!session) redirect("/owner-portal/login");

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    include: {
      properties: { include: { platforms: true } },
      contracts: { include: { property: true } },
    },
  });

  if (!owner || !owner.isActive) redirect("/owner-portal/login");

  const propertyIds = owner.properties.map((p) => p.id);

  const [reservations, liquidations, expenses, tasks] = await Promise.all([
    prisma.reservation.findMany({ where: { propertyId: { in: propertyIds } }, include: { guest: true, property: true } }),
    prisma.liquidation.findMany({ where: { propertyId: { in: propertyIds } }, include: { property: { include: { owner: true } } } }),
    prisma.expense.findMany({ where: { propertyId: { in: propertyIds } }, include: { property: true } }),
    prisma.task.findMany({ where: { propertyId: { in: propertyIds } }, include: { property: true } }),
  ]);

  return (
    <OwnerPortalClient
      owner={serializeOwner(owner) as any}
      properties={owner.properties.map((p) => serializeProperty(p as any)) as any}
      contracts={owner.contracts.map((c) => serializeContract({ ...c, owner, property: c.property as any })) as any}
      reservations={reservations.map((r) => serializeReservation(r as any)) as any}
      liquidations={liquidations.map((l) => serializeLiquidation(l as any)) as any}
      expenses={expenses.map((e) => serializeExpense(e as any)) as any}
      tasks={tasks.map((t) => serializeTask(t as any)) as any}
      mustChangePassword={session.mustChangePassword}
    />
  );
}
