import { NextResponse } from "next/server";
import { clearPortalCookie } from "@/lib/portal-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearPortalCookie(res);
  // Also clear any old cookie that may have been set with /owner-portal path
  res.cookies.set("owner_portal_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/owner-portal",
  });
  return res;
}
