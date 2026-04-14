import { NextResponse } from "next/server";
import { getRootContents } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "../_helpers";

export async function GET() {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  try {
    const data = await getRootContents(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.rootFolderId,
    );
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
