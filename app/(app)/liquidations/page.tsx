export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { getLiquidations } from "@/lib/db/queries";
import { serializeLiquidation } from "@/lib/db/serialize";
import { LiquidationsList } from "./components/liquidations-list";

export const metadata = { title: "Liquidaciones" };

export default async function LiquidationsPage() {
  const rawLiquidations = await getLiquidations();
  const liquidations = rawLiquidations.map((l) => serializeLiquidation(l as any));

  const totalPending = liquidations
    .filter((l) => l.status === "PENDING" || l.status === "OVERDUE")
    .reduce((s, l) => s + l.netToOwner, 0);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Liquidaciones" subtitle={`${liquidations.length} liquidaciones`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <LiquidationsList liquidations={liquidations as any} totalPending={totalPending} />
      </div>
    </div>
  );
}
