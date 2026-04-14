import { NextResponse, type NextRequest } from "next/server";
import { uploadFile } from "@/lib/google-drive/service";
import { getSessionAndTokens, driveError } from "@/app/api/drive/_helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const result = await getSessionAndTokens();
  if ("error" in result) return result.error;
  const { tokens } = result;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const parentId = formData.get("parentId") as string | null;

    if (!file || !parentId) {
      return NextResponse.json({ ok: false, error: "file y parentId requeridos" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await uploadFile(
      tokens.accessToken,
      tokens.refreshToken,
      file.name,
      file.type || "application/octet-stream",
      buffer,
      parentId,
    );

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return driveError(err);
  }
}
