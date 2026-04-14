import { NextRequest, NextResponse } from "next/server";
import { generateMonthlySummary } from "@/lib/ai/claude";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  try {
    const stats = await req.json();
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 503 });
    }
    const text = await generateMonthlySummary(stats);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Error generando resumen" }, { status: 500 });
  }
}
