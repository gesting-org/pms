import { Readable } from "stream";
import { getDriveClient, DRIVE_FILE_FIELDS, DRIVE_LIST_FIELDS } from "./client";
import { normalizeFile, normalizeFiles } from "./normalize";
import type { DriveItem, DriveFolderContents, DriveSearchResults } from "@/types/drive";
import { GOOGLE_MIME_TYPES } from "@/types/drive";

const PAGE_SIZE = 50;

// ─── Get root folder contents ──────────────────────────────────────────────────

export async function getRootContents(
  accessToken: string,
  refreshToken: string | undefined,
  rootFolderId?: string,
): Promise<DriveFolderContents> {
  const drive = getDriveClient(accessToken, refreshToken);
  const folderId = rootFolderId ?? "root";

  // Get folder metadata
  const folderMeta = await drive.files.get({
    fileId: folderId === "root" ? "root" : folderId,
    fields: DRIVE_FILE_FIELDS,
  });

  // List contents
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: DRIVE_LIST_FIELDS,
    orderBy: "folder,name",
    pageSize: PAGE_SIZE,
  });

  return {
    folder: normalizeFile(folderMeta.data),
    items: normalizeFiles(res.data.files ?? []),
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

// ─── Get folder contents by id ─────────────────────────────────────────────────

export async function getFolderContents(
  accessToken: string,
  refreshToken: string | undefined,
  folderId: string,
  pageToken?: string,
): Promise<DriveFolderContents> {
  const drive = getDriveClient(accessToken, refreshToken);

  const [folderMeta, listRes] = await Promise.all([
    drive.files.get({ fileId: folderId, fields: DRIVE_FILE_FIELDS }),
    drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: DRIVE_LIST_FIELDS,
      orderBy: "folder,name",
      pageSize: PAGE_SIZE,
      pageToken,
    }),
  ]);

  return {
    folder: normalizeFile(folderMeta.data),
    items: normalizeFiles(listRes.data.files ?? []),
    nextPageToken: listRes.data.nextPageToken ?? undefined,
  };
}

// ─── Get file metadata ─────────────────────────────────────────────────────────

export async function getFileMeta(
  accessToken: string,
  refreshToken: string | undefined,
  fileId: string,
): Promise<DriveItem> {
  const drive = getDriveClient(accessToken, refreshToken);
  const res = await drive.files.get({ fileId, fields: DRIVE_FILE_FIELDS });
  return normalizeFile(res.data);
}

// ─── Search files ──────────────────────────────────────────────────────────────

export async function searchFiles(
  accessToken: string,
  refreshToken: string | undefined,
  query: string,
  rootFolderId?: string,
  pageToken?: string,
): Promise<DriveSearchResults> {
  const drive = getDriveClient(accessToken, refreshToken);

  // Escape single quotes in the query to avoid injection
  const safeQuery = query.replace(/'/g, "\\'");

  // Scope search to root folder if configured
  const scopeClause = rootFolderId
    ? `'${rootFolderId}' in parents and `
    : "";

  // fullText search + name contains fallback
  const q = `${scopeClause}(name contains '${safeQuery}' or fullText contains '${safeQuery}') and trashed = false`;

  const res = await drive.files.list({
    q,
    fields: DRIVE_LIST_FIELDS,
    orderBy: "modifiedTime desc",
    pageSize: PAGE_SIZE,
    pageToken,
  });

  return {
    items: normalizeFiles(res.data.files ?? []),
    query,
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

// ─── Resolve breadcrumb path ───────────────────────────────────────────────────
// Walks up parent chain to build breadcrumb. Stops at rootFolderId or 'root'.

export async function resolveBreadcrumb(
  accessToken: string,
  refreshToken: string | undefined,
  folderId: string,
  rootFolderId?: string,
): Promise<{ id: string; name: string }[]> {
  const drive = getDriveClient(accessToken, refreshToken);
  const crumbs: { id: string; name: string }[] = [];
  let currentId = folderId;
  const stopAt = rootFolderId ?? "root";

  // Safety limit: max 10 levels deep
  for (let i = 0; i < 10; i++) {
    if (currentId === stopAt) {
      // Add root itself
      try {
        const meta = await drive.files.get({ fileId: currentId, fields: "id,name" });
        crumbs.unshift({ id: meta.data.id ?? currentId, name: meta.data.name ?? "Inicio" });
      } catch {
        crumbs.unshift({ id: currentId, name: "Inicio" });
      }
      break;
    }

    try {
      const meta = await drive.files.get({ fileId: currentId, fields: "id,name,parents" });
      crumbs.unshift({ id: meta.data.id ?? currentId, name: meta.data.name ?? "" });
      const parents = meta.data.parents ?? [];
      if (!parents.length) break;
      currentId = parents[0];
    } catch {
      break;
    }
  }

  return crumbs;
}

// ─── Create folder ─────────────────────────────────────────────────────────────

export async function createFolder(
  accessToken: string,
  refreshToken: string | undefined,
  name: string,
  parentId: string,
): Promise<DriveItem> {
  const drive = getDriveClient(accessToken, refreshToken);
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: GOOGLE_MIME_TYPES.FOLDER,
      parents: [parentId],
    },
    fields: DRIVE_FILE_FIELDS,
  });
  return normalizeFile(res.data);
}

// ─── Upload file ───────────────────────────────────────────────────────────────

export async function uploadFile(
  accessToken: string,
  refreshToken: string | undefined,
  name: string,
  mimeType: string,
  buffer: Buffer,
  parentId: string,
): Promise<DriveItem> {
  const drive = getDriveClient(accessToken, refreshToken);
  const stream = Readable.from(buffer);
  const res = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType, body: stream },
    fields: DRIVE_FILE_FIELDS,
  });
  return normalizeFile(res.data);
}

// ─── Rename file or folder ─────────────────────────────────────────────────────

export async function renameItem(
  accessToken: string,
  refreshToken: string | undefined,
  fileId: string,
  newName: string,
): Promise<DriveItem> {
  const drive = getDriveClient(accessToken, refreshToken);
  const res = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: DRIVE_FILE_FIELDS,
  });
  return normalizeFile(res.data);
}

// ─── Delete file or folder (move to trash) ────────────────────────────────────

export async function deleteItem(
  accessToken: string,
  refreshToken: string | undefined,
  fileId: string,
): Promise<void> {
  const drive = getDriveClient(accessToken, refreshToken);
  // Moves to trash instead of permanent delete — safer
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
  });
}
