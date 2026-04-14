import { NextRequest, NextResponse } from "next/server";
import { suggestReply } from "@/lib/ai/claude";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const { context, incomingMessage, recipientType } = await req.json();
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 503 });
    }
    const text = await suggestReply(context, incomingMessage, recipientType);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Error generando respuesta" }, { status: 500 });
  }
}
