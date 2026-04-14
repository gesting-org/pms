import { NextResponse, type NextRequest } from "next/server";
import { renameItem } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ ok: false, error: "name requerido" }, { status: 400 });
  }

  try {
    const data = await renameItem(tokens.accessToken, tokens.refreshToken, params.id, name.trim());
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
