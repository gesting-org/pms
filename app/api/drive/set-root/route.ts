export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setRootFolder } from "@/lib/google-drive/token-store";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const { folderId } = await req.json();
  if (!folderId || typeof folderId !== "string") {
    return NextResponse.json({ ok: false, error: "folderId requerido" }, { status: 400 });
  }
  const userId = (session.user as any)?.id ?? session.user?.email ?? "default";
  await setRootFolder(userId, folderId);
  return NextResponse.json({ ok: true });
}
