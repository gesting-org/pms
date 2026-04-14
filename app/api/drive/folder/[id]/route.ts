import { NextResponse, type NextRequest } from "next/server";
import { getFolderContents } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;

  try {
    const data = await getFolderContents(
      tokens.accessToken,
      tokens.refreshToken,
      params.id,
      pageToken,
    );
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
