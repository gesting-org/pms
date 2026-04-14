// ─── Google Drive normalized types ────────────────────────────────────────────

export type DriveItemKind = "folder" | "document" | "spreadsheet" | "presentation"
  | "pdf" | "image" | "video" | "audio" | "archive" | "code" | "other";

export interface DriveOwner {
  displayName: string;
  emailAddress: string;
  photoLink?: string;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  kind: DriveItemKind;
  isFolder: boolean;
  parents: string[];
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime: string;       // ISO string
  createdTime: string;        // ISO string
  size?: number;              // bytes, undefined for folders/Google Docs
  owners: DriveOwner[];
  starred: boolean;
  shared: boolean;
  description?: string;
}

export interface DriveBreadcrumb {
  id: string;
  name: string;
}

export interface DriveFolderContents {
  folder: DriveItem;
  items: DriveItem[];
  nextPageToken?: string;
}

export interface DriveSearchResults {
  items: DriveItem[];
  query: string;
  nextPageToken?: string;
}

// API response wrappers
export interface DriveApiResponse<T> {
  data: T;
  ok: true;
}
export interface DriveApiError {
  ok: false;
  error: string;
  code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "NO_TOKEN" | "DRIVE_ERROR" | "UNKNOWN";
}

export type DriveResult<T> = DriveApiResponse<T> | DriveApiError;

// MIME type map
export const GOOGLE_MIME_TYPES = {
  FOLDER:        "application/vnd.google-apps.folder",
  DOCUMENT:      "application/vnd.google-apps.document",
  SPREADSHEET:   "application/vnd.google-apps.spreadsheet",
  PRESENTATION:  "application/vnd.google-apps.presentation",
  FORM:          "application/vnd.google-apps.form",
  DRAWING:       "application/vnd.google-apps.drawing",
  SCRIPT:        "application/vnd.google-apps.script",
  SHORTCUT:      "application/vnd.google-apps.shortcut",
} as const;
