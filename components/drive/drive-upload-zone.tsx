"use client";

import { useRef, useState } from "react";
import { Upload, X, FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "./drive-utils";

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface DriveUploadZoneProps {
  parentId: string;
  onUploaded: () => void;
  onClose: () => void;
}

export function DriveUploadZone({ parentId, onUploaded, onClose }: DriveUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = files.some((f) => f.status === "uploading");

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({ file: f, status: "pending" as const })),
    ]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    let anyUploaded = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));
      try {
        const fd = new FormData();
        fd.append("file", files[i].file);
        fd.append("parentId", parentId);
        const res = await fetch("/api/drive/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
        anyUploaded = true;
      } catch (err) {
        setFiles((prev) => prev.map((f, idx) =>
          idx === i ? { ...f, status: "error", error: err instanceof Error ? err.message : "Error" } : f
        ));
      }
    }
    if (anyUploaded) onUploaded();
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const allDone = files.length > 0 && files.every((f) => f.status === "done");

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
          dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-border hover:bg-muted/30",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <FileUp className={cn("h-8 w-8 mx-auto mb-2 transition-colors", dragging ? "text-primary" : "text-muted-foreground/50")} />
        <p className="text-sm font-medium text-foreground">
          {dragging ? "Soltá los archivos aquí" : "Arrastrá archivos o hacé click"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Cualquier tipo de archivo</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{f.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(f.file.size)}</p>
              </div>
              <div className="shrink-0">
                {f.status === "pending" && (
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {f.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {f.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                {f.status === "error" && (
                  <span className="text-[10px] text-destructive">{f.error ?? "Error"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
          {allDone ? "Cerrar" : "Cancelar"}
        </Button>
        {!allDone && (
          <Button size="sm" onClick={handleUpload} disabled={pendingCount === 0 || uploading} className="gap-1.5">
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Upload className="h-3.5 w-3.5" />
            Subir {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
        )}
      </div>
    </div>
  );
}
