import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTokens } from "@/lib/google-drive/token-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, connected: false, error: "No autenticado" }, { status: 401 });
    }
    const userId = (session.user as any)?.id ?? session.user?.email ?? "default";
    const tokens = await getTokens(userId);
    return NextResponse.json({
      ok: true,
      connected: !!tokens,
      rootFolderId: tokens?.rootFolderId ?? null,
    });
  } catch (err) {
    console.error("[drive/status]", err);
    return NextResponse.json({ ok: false, connected: false, error: String(err) }, { status: 500 });
  }
}
