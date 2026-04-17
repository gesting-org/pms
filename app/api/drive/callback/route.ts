export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveTokens } from "@/lib/google-drive/token-store";

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(`${base}/documents?error=oauth_denied`);
  }

  let userId = "";
  if (state) {
    try {
      userId = Buffer.from(state, "base64").toString("utf-8");
    } catch {
      // ignore
    }
  }

  if (!userId) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(`${base}/login`);
    }
    userId = (session.user as any)?.id ?? session.user?.email ?? "default";
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  try {
    const { tokens } = await oauth2.getToken(code);
    await saveTokens(userId, {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ?? undefined,
    });
    return NextResponse.redirect(`${base}/documents?connected=1`);
  } catch (err) {
    console.error("[drive/callback] token exchange error:", err);
    return NextResponse.redirect(`${base}/documents?error=token_exchange`);
  }
}
