import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET =
  process.env.PORTAL_JWT_SECRET ?? "portal-secret-change-me-in-production-32chars";

const COOKIE_NAME = "owner_portal_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface PortalSession {
  ownerId: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
}

export function signPortalToken(payload: PortalSession): string {
  const { ownerId, email, name, mustChangePassword } = payload;
  return jwt.sign({ ownerId, email, name, mustChangePassword }, SECRET, { expiresIn: "7d" });
}

export function verifyPortalToken(token: string): PortalSession | null {
  try {
    return jwt.verify(token, SECRET) as PortalSession;
  } catch {
    return null;
  }
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPortalToken(token);
}

export function setPortalCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearPortalCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

export function requirePortalSession(req: NextRequest): PortalSession | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPortalToken(token);
}
