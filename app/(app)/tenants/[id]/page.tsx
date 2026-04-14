import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/db";
import { serializeGuest } from "@/lib/db/serialize";
import { TenantDetail } from "./tenant-detail";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  return { title: guest ? `${guest.firstName} ${guest.lastName}` : "Inquilino" };
}

export default async function TenantPage({ params }: { params: { id: string } }) {
  const raw = await prisma.guest.findUnique({
    where: { id: params.id },
    include: {
      reservations: { include: { property: true }, orderBy: { checkIn: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!raw) notFound();

  const tenant = serializeGuest(raw);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title={`${raw.firstName} ${raw.lastName}`}
        subtitle={`${raw.nationality ?? ""}${raw.dni ? ` · DNI ${raw.dni}` : ""}`}
      />
      <div className="p-4 md:p-6 animate-fade-in">
        <TenantDetail tenant={tenant as any} contracts={[]} payments={[]} messages={[]} />
      </div>
    </div>
  );
}
