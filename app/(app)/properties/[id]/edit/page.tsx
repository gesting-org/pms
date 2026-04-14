import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeProperty, serializeOwner } from "@/lib/db/serialize";
import { PropertyForm } from "../../components/property-form";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await prisma.property.findUnique({ where: { id: params.id } });
  return { title: p ? `Editar — ${p.name}` : "Editar propiedad" };
}

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const [rawProperty, rawOwners] = await Promise.all([
    prisma.property.findUnique({ where: { id: params.id }, include: { platforms: true } }),
    prisma.owner.findMany({ where: { isActive: true }, orderBy: { lastName: "asc" } }),
  ]);
  if (!rawProperty) notFound();

  const property = serializeProperty(rawProperty as any);
  const owners = rawOwners.map((o) => serializeOwner(o));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title={`Editar — ${rawProperty.name}`} />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <PropertyForm owners={owners as any} property={property as any} />
      </div>
    </div>
  );
}
