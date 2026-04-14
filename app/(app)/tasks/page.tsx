import { Topbar } from "@/components/layout/topbar";
import { getTasks, getProperties } from "@/lib/db/queries";
import { serializeTask, serializeProperty } from "@/lib/db/serialize";
import { TasksBoard } from "./components/tasks-board";
import { prisma } from "@/lib/db";
import type { GuestOrderRow } from "@/app/api/orders/route";

export const metadata = { title: "Tareas" };

async function getPendingOrders(): Promise<GuestOrderRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Only orders whose check-in is today or in the future (not yet delivered)
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
    WHERE "checkinDate" >= ${today}::date
    ORDER BY "checkinDate" ASC
  `;
  return rows;
}

export default async function TasksPage({ searchParams }: { searchParams: { propertyId?: string } }) {
  const [rawTasks, rawProperties, orders] = await Promise.all([
    getTasks(),
    getProperties(),
    getPendingOrders(),
  ]);

  const tasks = rawTasks
    .filter((t) => t.status !== "CANCELLED")
    .filter((t) => !searchParams.propertyId || t.propertyId === searchParams.propertyId)
    .map((t) => serializeTask(t as any));

  const properties = rawProperties.map((p) => serializeProperty(p as any));
  const activeCount = tasks.filter((t) => t.status !== "COMPLETED").length;

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Tareas y mantenimiento" subtitle={`${activeCount} activas`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <TasksBoard tasks={tasks as any} properties={properties as any} orders={orders} />
      </div>
    </div>
  );
}
