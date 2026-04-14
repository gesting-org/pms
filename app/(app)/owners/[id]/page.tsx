import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeOwner, serializeProperty, serializeContract } from "@/lib/db/serialize";
import { OwnerDetail } from "../components/owner-detail";

export default async function OwnerPage({ params }: { params: { id: string } }) {
  const raw = await prisma.owner.findUnique({
    where: { id: params.id },
    include: {
      properties: { include: { platforms: true } },
      contracts: { include: { property: true } },
    },
  });
  if (!raw) notFound();

  const owner = serializeOwner(raw);
  const properties = raw.properties.map((p) => serializeProperty(p as any));
  const contracts = raw.contracts.map((c) => serializeContract({ ...c, owner: raw, property: c.property as any }));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title={`${raw.firstName} ${raw.lastName}`} subtitle={`DNI ${raw.dni}`} />
      <div className="p-4 md:p-6 max-w-4xl animate-fade-in">
        <OwnerDetail owner={owner as any} properties={properties as any} contracts={contracts as any} />
      </div>
    </div>
  );
}
