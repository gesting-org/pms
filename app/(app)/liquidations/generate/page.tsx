import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeProperty, serializeOwner } from "@/lib/db/serialize";
import { LiquidationGenerator } from "../components/liquidation-generator";

export const metadata = { title: "Generar liquidación" };

export default async function GenerateLiquidationPage() {
  const [rawProperties, rawOwners] = await Promise.all([
    prisma.property.findMany({ orderBy: { name: "asc" }, include: { platforms: true } }),
    prisma.owner.findMany({ where: { isActive: true }, orderBy: { lastName: "asc" } }),
  ]);

  const properties = rawProperties.map((p) => serializeProperty(p as any));
  const owners = rawOwners.map((o) => serializeOwner(o));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Generar liquidación mensual" />
      <div className="p-4 md:p-6 max-w-2xl animate-fade-in">
        <LiquidationGenerator properties={properties as any} owners={owners as any} />
      </div>
    </div>
  );
}
