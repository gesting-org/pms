import { NextResponse, type NextRequest } from "next/server";
import { searchFiles } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "../_helpers";

export async function GET(req: NextRequest) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ ok: false, error: "La búsqueda debe tener al menos 2 caracteres", code: "UNKNOWN" }, { status: 400 });
  }

  const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;

  try {
    const data = await searchFiles(
      tokens.accessToken,
      tokens.refreshToken,
      q,
      tokens.rootFolderId,
      pageToken,
    );
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
