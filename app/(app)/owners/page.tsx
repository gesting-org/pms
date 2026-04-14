export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeOwner } from "@/lib/db/serialize";
import { OwnersList } from "./components/owners-list";

export const metadata = { title: "Propietarios" };

export default async function OwnersPage() {
  const rawOwners = await prisma.owner.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { lastName: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  const owners = rawOwners.map((o) => ({
    ...serializeOwner(o),
    propertiesCount: o._count.properties,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Propietarios" subtitle={`${owners.length} propietarios`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <OwnersList owners={owners as any} />
      </div>
    </div>
  );
}
