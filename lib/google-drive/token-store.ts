import { prisma as db } from "@/lib/db";
import { google } from "googleapis";

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;   // unix ms
  rootFolderId?: string;
}

// ─── Save / upsert tokens ──────────────────────────────────────────────────────

export async function saveTokens(userId: string, tokens: GoogleTokens) {
  await db.googleToken.upsert({
    where: { userId },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    },
    create: {
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    },
  });
}

// ─── Get tokens (with auto-refresh if expired) ────────────────────────────────

export async function getTokens(userId: string): Promise<GoogleTokens | null> {
  const row = await db.googleToken.findUnique({ where: { userId } });
  if (!row) return null;

  const tokens: GoogleTokens = {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? undefined,
    expiresAt: row.expiresAt ? row.expiresAt.getTime() : undefined,
    rootFolderId: row.rootFolderId ?? undefined,
  };

  // Auto-refresh if expired or expiring within 5 minutes
  if (tokens.refreshToken && tokens.expiresAt) {
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() >= tokens.expiresAt - fiveMinutes) {
      const refreshed = await refreshAccessToken(userId, tokens.refreshToken);
      if (refreshed) return refreshed;
    }
  }

  return tokens;
}

// ─── Refresh access token ──────────────────────────────────────────────────────

async function refreshAccessToken(userId: string, refreshToken: string): Promise<GoogleTokens | null> {
  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    oauth2.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2.refreshAccessToken();

    const updated: GoogleTokens = {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token ?? refreshToken,
      expiresAt: credentials.expiry_date ?? undefined,
    };

    await db.googleToken.update({
      where: { userId },
      data: {
        accessToken: updated.accessToken,
        refreshToken: updated.refreshToken ?? null,
        expiresAt: updated.expiresAt ? new Date(updated.expiresAt) : null,
      },
    });

    return updated;
  } catch {
    return null;
  }
}

// ─── Clear tokens ──────────────────────────────────────────────────────────────

export async function clearTokens(userId: string) {
  await db.googleToken.deleteMany({ where: { userId } });
}

// ─── Check if connected ────────────────────────────────────────────────────────

export async function hasTokens(userId: string): Promise<boolean> {
  const count = await db.googleToken.count({ where: { userId } });
  return count > 0;
}

// ─── Set root folder ───────────────────────────────────────────────────────────

export async function setRootFolder(userId: string, folderId: string) {
  await db.googleToken.update({
    where: { userId },
    data: { rootFolderId: folderId },
  });
}
