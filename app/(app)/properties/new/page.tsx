import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeOwner } from "@/lib/db/serialize";
import { PropertyForm } from "../components/property-form";

export const metadata = { title: "Nueva propiedad" };

export default async function NewPropertyPage() {
  const rawOwners = await prisma.owner.findMany({ where: { isActive: true }, orderBy: { lastName: "asc" } });
  const owners = rawOwners.map((o) => serializeOwner(o));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nueva propiedad" subtitle="Completá los datos de la propiedad" />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <PropertyForm owners={owners as any} />
      </div>
    </div>
  );
}
