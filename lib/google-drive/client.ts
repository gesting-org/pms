import { google } from "googleapis";

/**
 * Returns an authenticated Google Drive API client using
 * the stored OAuth tokens (access + refresh).
 */
export function getDriveClient(accessToken: string, refreshToken?: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  auth.setCredentials({
    access_token: accessToken,
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Minimal fields requested from Drive API to keep responses fast.
 * Only fetch what the UI actually needs.
 */
export const DRIVE_FILE_FIELDS =
  "id,name,mimeType,parents,webViewLink,iconLink,thumbnailLink," +
  "modifiedTime,createdTime,size,owners,starred,shared,description";

export const DRIVE_LIST_FIELDS =
  `nextPageToken,files(${DRIVE_FILE_FIELDS})`;
