"use client";

import { useState } from "react";
import { RefreshCw, LogOut, FolderRoot, FolderPlus, Upload, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDrive } from "@/hooks/use-drive";
import { DriveBreadcrumbBar } from "./drive-breadcrumb";
import { DriveSearch } from "./drive-search";
import { DriveFileListWithActions } from "./drive-file-list";
import { DriveNotConnected, DriveLoading, DriveEmpty, DriveSearchEmpty, DriveError } from "./drive-states";
import { CreateFolderModal, RenameModal, DeleteModal } from "./drive-modals";
import { DriveUploadZone } from "./drive-upload-zone";
import type { DriveItem } from "@/types/drive";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function DriveBrowser() {
  const drive = useDrive();
  const { toast } = useToast();

  // Modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [renameItem, setRenameItem] = useState<DriveItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DriveItem | null>(null);

  const isLoading = drive.status === "loading" || drive.status === "idle";
  const isSearching = drive.status === "searching";
  const isError = drive.status === "error";
  const isNoToken = drive.status === "no-token";
  const isSearchMode = drive.searchResults !== null;
  const displayItems = drive.searchResults ?? drive.items;
  const currentParentId = drive.currentFolder?.id ?? "root";

  if (isNoToken) return <DriveNotConnected />;

  // ─── Write actions ──────────────────────────────────────────────────────────

  async function handleCreateFolder(name: string) {
    const res = await fetch("/api/drive/create-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: currentParentId }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    toast({ title: `Carpeta "${name}" creada` });
    drive.refresh();
  }

  async function handleRename(newName: string) {
    if (!renameItem) return;
    const res = await fetch(`/api/drive/rename/${renameItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    toast({ title: `Renombrado a "${newName}"` });
    drive.refresh();
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const res = await fetch(`/api/drive/delete/${deleteItem.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    toast({ title: `"${deleteItem.name}" movido a la papelera` });
    drive.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Breadcrumb / search result label */}
        <div className="flex-1 min-w-0">
          {!isSearchMode && drive.breadcrumb.length > 0 ? (
            <DriveBreadcrumbBar
              breadcrumb={drive.breadcrumb}
              onNavigate={drive.navigateTo}
              disabled={isLoading}
            />
          ) : isSearchMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {displayItems.length} resultado{displayItems.length !== 1 ? "s" : ""} para
              </span>
              <span className="text-sm font-semibold text-foreground">"{drive.searchQuery}"</span>
            </div>
          ) : null}
        </div>

        {/* Search */}
        <DriveSearch
          value={drive.searchQuery}
          onChange={drive.search}
          onClear={drive.clearSearch}
          isSearching={isSearching}
          disabled={isLoading}
        />

        {/* Write actions */}
        {!isSearchMode && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setShowCreateFolder(true)}
              disabled={isLoading}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nueva carpeta</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setShowUpload(true)}
              disabled={isLoading}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Subir</span>
            </Button>
          </div>
        )}

        {/* Secondary actions */}
        <div className="flex items-center gap-1">
          <Button
            size="sm" variant="ghost"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={drive.refresh} disabled={isLoading} title="Actualizar"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
            onClick={drive.disconnect} title="Desconectar Google Drive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Folder info bar */}
      {!isSearchMode && drive.currentFolder && !isLoading && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
          <FolderRoot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{drive.currentFolder.name}</span>
          {drive.currentFolder.description && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground/70 truncate">{drive.currentFolder.description}</span>
            </>
          )}
          <span className="ml-auto text-xs text-muted-foreground/60 shrink-0">
            {drive.items.length} {drive.items.length === 1 ? "elemento" : "elementos"}
          </span>
        </div>
      )}

      {/* Main content */}
      {isLoading || isSearching ? (
        <DriveLoading />
      ) : isError ? (
        <DriveError message={drive.error ?? "Error desconocido"} onRetry={drive.refresh} />
      ) : isSearchMode && displayItems.length === 0 ? (
        <DriveSearchEmpty query={drive.searchQuery} />
      ) : displayItems.length === 0 ? (
        <DriveEmpty />
      ) : (
        <DriveFileListWithActions
          items={displayItems}
          onOpen={drive.openFile}
          onRename={(item) => setRenameItem(item)}
          onDelete={(item) => setDeleteItem(item)}
          isSearchResult={isSearchMode}
        />
      )}

      {/* Connected badge */}
      {drive.connected && !isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Google Drive conectado · Datos en tiempo real
        </div>
      )}

      {/* ── Modals ── */}
      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={handleCreateFolder}
      />

      <RenameModal
        open={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onConfirm={handleRename}
      />

      <DeleteModal
        open={!!deleteItem}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" />
              Subir archivos
            </DialogTitle>
          </DialogHeader>
          <DriveUploadZone
            parentId={currentParentId}
            onUploaded={() => { drive.refresh(); }}
            onClose={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
