import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeContract, serializeProperty, serializeOwner } from "@/lib/db/serialize";
import { ContractDetail } from "../components/contract-detail";

export default async function ContractPage({ params }: { params: { id: string } }) {
  const raw = await prisma.managementContract.findUnique({
    where: { id: params.id },
    include: { property: { include: { platforms: true } }, owner: true },
  });
  if (!raw) notFound();

  const contract = serializeContract(raw as any);
  const property = serializeProperty(raw.property as any);
  const owner = serializeOwner(raw.owner);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title={raw.contractNumber}
        subtitle={`${raw.property.name} · ${raw.ownerFullName}`}
      />
      <div className="p-4 md:p-6 max-w-4xl animate-fade-in">
        <ContractDetail contract={contract as any} property={property as any} owner={owner as any} />
      </div>
    </div>
  );
}
