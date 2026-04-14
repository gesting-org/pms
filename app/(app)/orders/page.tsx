export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { OrdersList } from "./components/orders-list";
import type { GuestOrderRow } from "@/app/api/orders/route";

export const metadata = { title: "Pedidos" };

async function getOrders(): Promise<GuestOrderRow[]> {
  const rows = await prisma.$queryRaw<GuestOrderRow[]>`
    SELECT
      id::text,
      "bookingCode",
      "guestName",
      "propertyName",
      "checkinDate"::text,
      items,
      notes,
      "totalARS"::float8 AS "totalARS",
      "createdAt"::text AS "createdAt"
    FROM "GuestOrder"
    ORDER BY "createdAt" DESC
  `;
  return rows;
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Pedidos" subtitle={`${orders.length} pedido${orders.length !== 1 ? "s" : ""}`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <OrdersList orders={orders} />
      </div>
    </div>
  );
}
