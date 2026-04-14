"use client";

import { Cloud, CloudOff, FolderOpen, SearchX, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Not connected ─────────────────────────────────────────────────────────────

export function DriveNotConnected() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
        <Cloud className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        Conectá tu cuenta de Google
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        Para explorar archivos en tiempo real, conectá una cuenta de Google con acceso a Google Drive.
      </p>
      <Button asChild size="sm" className="gap-2">
        <a href="/api/drive/connect">
          <GoogleIcon />
          Conectar Google Drive
        </a>
      </Button>
      <p className="text-xs text-muted-foreground mt-4 max-w-xs">
        Solo se solicita acceso de <strong>solo lectura</strong> a tus archivos de Drive.
      </p>
    </div>
  );
}

// ─── Loading ───────────────────────────────────────────────────────────────────

export function DriveLoading() {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Skeleton header */}
      <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        {["w-12", "w-10", "w-16", "w-14", "w-8"].map((w, i) => (
          <div key={i} className={`h-2.5 ${w} bg-muted rounded animate-pulse`} />
        ))}
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className={`h-2.5 bg-muted rounded animate-pulse ${i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-2/3" : "w-1/3"}`} />
              <div className="h-2 bg-muted/60 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty folder ──────────────────────────────────────────────────────────────

export function DriveEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-dashed border-border/60">
      <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Carpeta vacía</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Esta carpeta no tiene archivos.</p>
    </div>
  );
}

// ─── Empty search ──────────────────────────────────────────────────────────────

export function DriveSearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-dashed border-border/60">
      <SearchX className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Sin resultados para "{query}"</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Probá con otro término de búsqueda.</p>
    </div>
  );
}

// ─── Error ─────────────────────────────────────────────────────────────────────

export function DriveError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isAuthError = message.toLowerCase().includes("token") || message.toLowerCase().includes("expirado");
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        {isAuthError ? (
          <CloudOff className="h-7 w-7 text-destructive/70" />
        ) : (
          <AlertTriangle className="h-7 w-7 text-destructive/70" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {isAuthError ? "Sesión de Google expirada" : "Error al cargar archivos"}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-5">{message}</p>
      <div className="flex gap-2">
        {isAuthError ? (
          <Button asChild size="sm" className="gap-2">
            <a href="/api/drive/connect"><GoogleIcon />Reconectar Google</a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="gap-2" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
