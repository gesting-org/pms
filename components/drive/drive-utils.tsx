import {
  Folder, FileText, FileSpreadsheet, Presentation, FileImage,
  Film, Music, Archive, Code, File, FileType,
} from "lucide-react";
import type { DriveItemKind } from "@/types/drive";
import { cn } from "@/lib/utils";

// ─── Icon by kind ──────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<DriveItemKind, { icon: any; color: string; label: string }> = {
  folder:       { icon: Folder,           color: "text-amber-400",   label: "Carpeta" },
  document:     { icon: FileText,         color: "text-blue-500",    label: "Documento" },
  spreadsheet:  { icon: FileSpreadsheet,  color: "text-emerald-500", label: "Hoja de cálculo" },
  presentation: { icon: Presentation,     color: "text-orange-500",  label: "Presentación" },
  pdf:          { icon: FileType,         color: "text-red-500",     label: "PDF" },
  image:        { icon: FileImage,        color: "text-purple-500",  label: "Imagen" },
  video:        { icon: Film,             color: "text-pink-500",    label: "Video" },
  audio:        { icon: Music,            color: "text-indigo-500",  label: "Audio" },
  archive:      { icon: Archive,          color: "text-slate-500",   label: "Archivo comprimido" },
  code:         { icon: Code,             color: "text-cyan-500",    label: "Código" },
  other:        { icon: File,             color: "text-slate-400",   label: "Archivo" },
};

interface DriveIconProps {
  kind: DriveItemKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DriveIcon({ kind, size = "md", className }: DriveIconProps) {
  const { icon: Icon, color } = KIND_CONFIG[kind] ?? KIND_CONFIG.other;
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return <Icon className={cn(sizeClass, color, className)} />;
}

export function getKindLabel(kind: DriveItemKind): string {
  return KIND_CONFIG[kind]?.label ?? "Archivo";
}

// ─── Format file size ──────────────────────────────────────────────────────────

export function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ─── Format relative date ──────────────────────────────────────────────────────

export function formatDriveDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7)  return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
  if (days < 365) return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}
