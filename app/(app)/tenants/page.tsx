import { Topbar } from "@/components/layout/topbar";
import { getGuests } from "@/lib/db/queries";
import { serializeGuest } from "@/lib/db/serialize";
import { TenantsList } from "./tenants-list";

export const metadata = { title: "Inquilinos" };

export default async function TenantsPage() {
  const rawGuests = await getGuests();
  const tenants = rawGuests.map((g) => ({
    ...serializeGuest(g),
    contracts: [] as any[],
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Inquilinos"
        subtitle={`${tenants.length} inquilinos registrados`}
      />
      <div className="p-4 md:p-6 animate-fade-in">
        <TenantsList tenants={tenants as any} />
      </div>
    </div>
  );
}
