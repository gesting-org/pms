import type { drive_v3 } from "googleapis";
import type { DriveItem, DriveItemKind, DriveOwner } from "@/types/drive";
import { GOOGLE_MIME_TYPES } from "@/types/drive";

// ─── Kind resolver ─────────────────────────────────────────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
const ARCHIVE_TYPES = ["application/zip", "application/x-rar-compressed", "application/x-tar", "application/gzip"];
const CODE_TYPES = ["text/plain", "application/json", "text/html", "text/css", "application/javascript", "text/x-python"];

function resolveKind(mimeType: string): DriveItemKind {
  if (mimeType === GOOGLE_MIME_TYPES.FOLDER)        return "folder";
  if (mimeType === GOOGLE_MIME_TYPES.DOCUMENT)      return "document";
  if (mimeType === GOOGLE_MIME_TYPES.SPREADSHEET)   return "spreadsheet";
  if (mimeType === GOOGLE_MIME_TYPES.PRESENTATION)  return "presentation";
  if (mimeType === "application/pdf")               return "pdf";
  if (IMAGE_TYPES.includes(mimeType))               return "image";
  if (VIDEO_TYPES.includes(mimeType))               return "video";
  if (AUDIO_TYPES.includes(mimeType))               return "audio";
  if (ARCHIVE_TYPES.includes(mimeType))             return "archive";
  if (CODE_TYPES.includes(mimeType))                return "code";
  return "other";
}

// ─── Normalizer ────────────────────────────────────────────────────────────────

export function normalizeFile(raw: drive_v3.Schema$File): DriveItem {
  const mimeType = raw.mimeType ?? "application/octet-stream";

  const owners: DriveOwner[] = (raw.owners ?? []).map((o) => ({
    displayName: o.displayName ?? "Desconocido",
    emailAddress: o.emailAddress ?? "",
    photoLink: o.photoLink ?? undefined,
  }));

  return {
    id: raw.id ?? "",
    name: raw.name ?? "(sin nombre)",
    mimeType,
    kind: resolveKind(mimeType),
    isFolder: mimeType === GOOGLE_MIME_TYPES.FOLDER,
    parents: raw.parents ?? [],
    webViewLink: raw.webViewLink ?? "",
    iconLink: raw.iconLink ?? undefined,
    thumbnailLink: raw.thumbnailLink ?? undefined,
    modifiedTime: raw.modifiedTime ?? new Date().toISOString(),
    createdTime: raw.createdTime ?? new Date().toISOString(),
    size: raw.size ? parseInt(raw.size, 10) : undefined,
    owners,
    starred: raw.starred ?? false,
    shared: raw.shared ?? false,
    description: raw.description ?? undefined,
  };
}

export function normalizeFiles(raws: drive_v3.Schema$File[]): DriveItem[] {
  return raws.map(normalizeFile);
}
