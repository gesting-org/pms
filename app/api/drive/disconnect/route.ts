export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clearTokens } from "@/lib/google-drive/token-store";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const userId = (session.user as any)?.id ?? session.user?.email ?? "default";
  await clearTokens(userId);
  return NextResponse.json({ ok: true });
}
