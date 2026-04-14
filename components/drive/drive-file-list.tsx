"use client";

import { ExternalLink, ChevronRight, Star, MoreHorizontal, Pencil, Trash2, ExternalLinkIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { DriveItem } from "@/types/drive";
import { DriveIcon, getKindLabel, formatBytes, formatDriveDate } from "./drive-utils";
import { cn } from "@/lib/utils";

interface DriveFileListProps {
  items: DriveItem[];
  onOpen: (item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  isSearchResult?: boolean;
}

export function DriveFileListWithActions({ items, onOpen, onRename, onDelete, isSearchResult }: DriveFileListProps) {
  const folders = isSearchResult ? [] : items.filter((i) => i.isFolder);
  const files   = isSearchResult ? items : items.filter((i) => !i.isFolder);

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Nombre</span>
        <span>Tipo</span>
        <span>Modificado</span>
        <span>Propietario</span>
        <span className="w-16 text-right">Tamaño</span>
      </div>

      <div className="divide-y divide-border/40">
        {folders.map((item) => (
          <DriveRow key={item.id} item={item} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
        ))}
        {files.map((item) => (
          <DriveRow key={item.id} item={item} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ─── Single row ────────────────────────────────────────────────────────────────

function DriveRow({
  item,
  onOpen,
  onRename,
  onDelete,
}: {
  item: DriveItem;
  onOpen: (i: DriveItem) => void;
  onRename: (i: DriveItem) => void;
  onDelete: (i: DriveItem) => void;
}) {
  return (
    <div className="group grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 hover:bg-accent/40 transition-colors">
      {/* Name — clickable */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
        className="flex items-center gap-3 min-w-0 cursor-pointer outline-none"
      >
        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-muted/50 group-hover:bg-muted/80 transition-colors">
          <DriveIcon kind={item.kind} size="sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-snug group-hover:text-primary transition-colors">
            {item.name}
          </p>
          {/* Mobile metadata */}
          <p className="text-xs text-muted-foreground md:hidden mt-0.5">
            {getKindLabel(item.kind)} · {formatDriveDate(item.modifiedTime)}
          </p>
        </div>
        {item.starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0 ml-1" />}
      </div>

      {/* Type */}
      <span className="hidden md:block text-sm text-muted-foreground truncate">
        {getKindLabel(item.kind)}
      </span>

      {/* Modified */}
      <span className="hidden md:block text-sm text-muted-foreground">
        {formatDriveDate(item.modifiedTime)}
      </span>

      {/* Owner */}
      <span className="hidden md:block text-sm text-muted-foreground truncate">
        {item.owners[0]?.displayName ?? "—"}
      </span>

      {/* Size + context menu */}
      <div className="flex items-center gap-1 justify-end">
        {!item.isFolder && (
          <span className="hidden md:block text-xs text-muted-foreground tabular-nums mr-1">
            {formatBytes(item.size)}
          </span>
        )}

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!item.isFolder && item.webViewLink && (
              <DropdownMenuItem onClick={() => window.open(item.webViewLink, "_blank", "noopener,noreferrer")}>
                <ExternalLinkIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Abrir en Drive
              </DropdownMenuItem>
            )}
            {item.isFolder && (
              <DropdownMenuItem onClick={() => onOpen(item)}>
                <ChevronRight className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Abrir carpeta
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onRename(item)}>
              <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Mover a papelera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Arrow / external icon */}
        {item.isFolder
          ? <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-pointer" onClick={() => onOpen(item)} />
          : <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors cursor-pointer" onClick={() => onOpen(item)} />
        }
      </div>
    </div>
  );
}
