import { NextResponse, type NextRequest } from "next/server";
import { createFolder } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export async function POST(req: NextRequest) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  const { name, parentId } = await req.json();
  if (!name?.trim() || !parentId) {
    return NextResponse.json({ ok: false, error: "name y parentId requeridos" }, { status: 400 });
  }

  try {
    const data = await createFolder(tokens.accessToken, tokens.refreshToken, name.trim(), parentId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
