"use client";

import { useState } from "react";
import { Loader2, FolderPlus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DriveItem } from "@/types/drive";

// ─── Create Folder Modal ───────────────────────────────────────────────────────

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}

export function CreateFolderModal({ open, onClose, onConfirm }: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onConfirm(name.trim());
      setName("");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-4 w-4 text-amber-500" />
            Nueva carpeta
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-sm">Nombre</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sin título"
              disabled={loading}
              className="h-9"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Crear carpeta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rename Modal ──────────────────────────────────────────────────────────────

interface RenameModalProps {
  open: boolean;
  item: DriveItem | null;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export function RenameModal({ open, item, onClose, onConfirm }: RenameModalProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [loading, setLoading] = useState(false);

  // Sync name when item changes
  if (item && name !== item.name && !loading) {
    setName(item.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === item?.name) return;
    setLoading(true);
    try {
      await onConfirm(name.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-blue-500" />
            Renombrar
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-sm">Nuevo nombre</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="h-9"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || name === item?.name || loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  item: DriveItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteModal({ open, item, onClose, onConfirm }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Mover a la papelera
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          ¿Mover <span className="font-semibold text-foreground">"{item?.name}"</span> a la papelera de Google Drive?
          <p className="mt-1.5 text-xs">Podés recuperarlo desde la papelera de Drive.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mover a papelera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
