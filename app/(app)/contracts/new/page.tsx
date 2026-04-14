import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeProperty, serializeOwner } from "@/lib/db/serialize";
import { ContractGenerator } from "../components/contract-generator";

export const metadata = { title: "Nuevo contrato" };

export default async function NewContractPage({ searchParams }: { searchParams: { propertyId?: string } }) {
  const [rawProperties, rawOwners] = await Promise.all([
    prisma.property.findMany({ orderBy: { name: "asc" }, include: { platforms: true } }),
    prisma.owner.findMany({ where: { isActive: true }, orderBy: { lastName: "asc" } }),
  ]);

  const properties = rawProperties.map((p) => serializeProperty(p as any));
  const owners = rawOwners.map((o) => serializeOwner(o));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nuevo contrato de gestión" subtitle="Generador con IA" />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <ContractGenerator
          properties={properties as any}
          owners={owners as any}
          defaultPropertyId={searchParams.propertyId}
        />
      </div>
    </div>
  );
}
