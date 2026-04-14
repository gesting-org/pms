import { NextRequest, NextResponse } from "next/server";
import { generateContract } from "@/lib/ai/claude";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 503 });
    }

    const text = await generateContract(body);
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generando contrato:", error);
    return NextResponse.json({ error: "Error al generar contrato" }, { status: 500 });
  }
}
