import { NextResponse } from "next/server";
import { deleteItem } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  try {
    await deleteItem(tokens.accessToken, tokens.refreshToken, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return driveError(err);
  }
}
