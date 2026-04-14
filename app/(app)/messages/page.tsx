import { Topbar } from "@/components/layout/topbar";
import { getMessages } from "@/lib/db/queries";
import { serializeMessage } from "@/lib/db/serialize";
import { MessagesInbox } from "./components/messages-inbox";

export const metadata = { title: "Mensajes" };

export default async function MessagesPage() {
  const rawMessages = await getMessages();
  const messages = rawMessages.map((m) => ({
    id: m.id,
    type: m.guestId ? "guest" as const : "owner" as const,
    contactName: m.guest
      ? `${m.guest.firstName} ${m.guest.lastName}`
      : "Propietario",
    subject: m.subject ?? "",
    body: m.body,
    channel: (m.channel === "INTERNAL" ? "EMAIL" : m.channel) as "EMAIL" | "WHATSAPP",
    direction: m.direction as "INBOUND" | "OUTBOUND",
    status: (m.status === "READ" ? "READ" : m.status === "SENT" || m.status === "DELIVERED" ? "SENT" : "UNREAD") as "READ" | "SENT" | "UNREAD",
    propertyName: m.property?.name ?? "",
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Mensajes" subtitle="Bandeja unificada" />
      <div className="p-4 md:p-6 animate-fade-in">
        <MessagesInbox messages={messages} />
      </div>
    </div>
  );
}
