import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTokens } from "@/lib/google-drive/token-store";
import { NextResponse } from "next/server";

export async function getSessionAndTokens() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ ok: false, error: "No autenticado", code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  const userId = (session.user as any)?.id ?? session.user?.email ?? "default";
  const tokens = await getTokens(userId);

  if (!tokens) {
    return {
      error: NextResponse.json({ ok: false, error: "No hay cuenta de Google conectada", code: "NO_TOKEN" }, { status: 403 }),
    };
  }

  return { session, userId, tokens };
}

export function driveError(err: unknown) {
  const message = err instanceof Error ? err.message : "Error desconocido";
  const isAuth = message.includes("401") || message.includes("invalid_grant");
  return NextResponse.json(
    { ok: false, error: isAuth ? "Token de Google expirado. Reconectá tu cuenta." : message, code: isAuth ? "UNAUTHORIZED" : "DRIVE_ERROR" },
    { status: isAuth ? 401 : 500 },
  );
}
