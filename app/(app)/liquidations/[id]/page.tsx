import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeLiquidation, serializeOwner, serializeExpense, serializeReservation } from "@/lib/db/serialize";
import { LiquidationDetail } from "../components/liquidation-detail";

export default async function LiquidationPage({ params }: { params: { id: string } }) {
  const raw = await prisma.liquidation.findUnique({
    where: { id: params.id },
    include: {
      property: { include: { owner: true } },
      expenses: true,
      reservations: { include: { guest: true } },
    },
  });
  if (!raw) notFound();

  const liquidation = serializeLiquidation(raw as any);
  const owner = serializeOwner(raw.property.owner);
  const expenses = raw.expenses.map((e) => serializeExpense(e as any));
  const reservations = raw.reservations.map((r) => serializeReservation(r as any));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title={`Liquidación ${raw.periodLabel}`} subtitle={raw.property.name} />
      <div className="p-4 md:p-6 max-w-3xl animate-fade-in">
        <LiquidationDetail
          liquidation={liquidation as any}
          property={liquidation.property as any}
          owner={owner as any}
          expenses={expenses as any}
          reservations={reservations as any}
        />
      </div>
    </div>
  );
}
