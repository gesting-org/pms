import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      include: { guest: true, property: true, reservation: true },
    });
    return NextResponse.json({ ok: true, data: messages });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { recipientType, recipientId, propertyId, channel, subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ ok: false, error: "Asunto y mensaje requeridos" }, { status: 400 });
    }

    const messageData: any = {
      direction: "OUTBOUND",
      channel: channel ?? "EMAIL",
      subject,
      body,
      status: "DELIVERED",
      sentAt: new Date(),
    };

    if (propertyId) messageData.propertyId = propertyId;

    if (recipientType === "guest" && recipientId) {
      messageData.guestId = recipientId;
    }

    const message = await prisma.message.create({ data: messageData });
    return NextResponse.json({ ok: true, id: message.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
