export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",  // full access: read + write + delete
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const userId = (session.user as any)?.id ?? session.user?.email ?? "default";

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: Buffer.from(userId).toString("base64"),
  });

  return NextResponse.redirect(url);
}
