export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { getProperties } from "@/lib/db/queries";
import { serializeProperty } from "@/lib/db/serialize";
import { PropertiesList } from "./components/properties-list";

export const metadata = { title: "Propiedades" };

export default async function PropertiesPage() {
  const rawProperties = await getProperties();
  const properties = rawProperties.map((p) => serializeProperty(p as any));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Propiedades"
        subtitle={`${properties.length} propiedades en gestión`}
      />
      <div className="p-4 md:p-6 animate-fade-in">
        <PropertiesList properties={properties as any} />
      </div>
    </div>
  );
}
