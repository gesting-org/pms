import { NextResponse } from "next/server";
import { getFileMeta } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  try {
    const data = await getFileMeta(tokens.accessToken, tokens.refreshToken, params.id);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
