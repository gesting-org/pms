"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DriveItem, DriveBreadcrumb, DriveFolderContents } from "@/types/drive";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DriveStatus = "idle" | "loading" | "ready" | "error" | "no-token" | "searching";

interface DriveState {
  status: DriveStatus;
  items: DriveItem[];
  currentFolder: DriveItem | null;
  breadcrumb: DriveBreadcrumb[];
  searchQuery: string;
  searchResults: DriveItem[] | null;    // null = not searching
  nextPageToken: string | null;
  error: string | null;
  connected: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useDrive() {
  const [state, setState] = useState<DriveState>({
    status: "idle",
    items: [],
    currentFolder: null,
    breadcrumb: [],
    searchQuery: "",
    searchResults: null,
    nextPageToken: null,
    error: null,
    connected: false,
  });

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Check connection status on mount ────────────────────────────────────────

  useEffect(() => {
    // If redirected back from OAuth, skip status check and load directly
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      setState((s) => ({ ...s, connected: true }));
      loadRoot();
    } else if (params.get("error")) {
      window.history.replaceState({}, "", window.location.pathname);
      setState((s) => ({ ...s, status: "error", error: "Error al conectar con Google. Intentá de nuevo." }));
    } else {
      checkStatus();
    }
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/drive/status");
      const json = await res.json();
      if (json.connected) {
        setState((s) => ({ ...s, connected: true }));
        loadRoot();
      } else {
        setState((s) => ({ ...s, connected: false, status: "no-token" }));
      }
    } catch {
      setState((s) => ({ ...s, status: "error", error: "Error al verificar conexión con Google Drive" }));
    }
  }

  // ─── Load root ────────────────────────────────────────────────────────────────

  const loadRoot = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", searchResults: null, searchQuery: "" }));
    try {
      const res = await fetch("/api/drive/root");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const contents: DriveFolderContents = json.data;
      setState((s) => ({
        ...s,
        status: "ready",
        items: contents.items,
        currentFolder: contents.folder,
        breadcrumb: [{ id: contents.folder.id, name: "Inicio" }],
        nextPageToken: contents.nextPageToken ?? null,
        error: null,
        connected: true,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error cargando Drive";
      const isNoToken = msg.includes("NO_TOKEN") || msg.includes("No hay cuenta");
      setState((s) => ({
        ...s,
        status: isNoToken ? "no-token" : "error",
        error: msg,
        connected: !isNoToken,
      }));
    }
  }, []);

  // ─── Enter folder ─────────────────────────────────────────────────────────────

  const enterFolder = useCallback(async (folder: DriveItem) => {
    setState((s) => ({ ...s, status: "loading", searchResults: null, searchQuery: "" }));
    try {
      const res = await fetch(`/api/drive/folder/${folder.id}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const contents: DriveFolderContents = json.data;

      setState((s) => {
        // Build breadcrumb: if folder already in crumb, slice to it; else append
        const existingIdx = s.breadcrumb.findIndex((c) => c.id === folder.id);
        const newCrumb = existingIdx >= 0
          ? s.breadcrumb.slice(0, existingIdx + 1)
          : [...s.breadcrumb, { id: folder.id, name: folder.name }];

        return {
          ...s,
          status: "ready",
          items: contents.items,
          currentFolder: contents.folder,
          breadcrumb: newCrumb,
          nextPageToken: contents.nextPageToken ?? null,
          error: null,
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Error al abrir carpeta",
      }));
    }
  }, []);

  // ─── Navigate via breadcrumb ──────────────────────────────────────────────────

  const navigateTo = useCallback(async (crumb: DriveBreadcrumb, index: number) => {
    if (index === 0) {
      // Root
      setState((s) => ({ ...s, breadcrumb: [s.breadcrumb[0]] }));
      loadRoot();
      return;
    }
    // Slice breadcrumb to this level then load folder
    setState((s) => ({ ...s, breadcrumb: s.breadcrumb.slice(0, index + 1) }));
    const fakeFolder: DriveItem = {
      id: crumb.id,
      name: crumb.name,
      mimeType: "application/vnd.google-apps.folder",
      kind: "folder",
      isFolder: true,
      parents: [],
      webViewLink: "",
      modifiedTime: "",
      createdTime: "",
      owners: [],
      starred: false,
      shared: false,
    };
    await enterFolder(fakeFolder);
  }, [loadRoot, enterFolder]);

  // ─── Search with debounce ─────────────────────────────────────────────────────

  const search = useCallback((query: string) => {
    setState((s) => ({ ...s, searchQuery: query }));

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query || query.trim().length < 2) {
      setState((s) => ({ ...s, searchResults: null, status: "ready" }));
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setState((s) => ({ ...s, status: "searching" }));
      try {
        const res = await fetch(`/api/drive/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setState((s) => ({
          ...s,
          status: "ready",
          searchResults: json.data.items,
          error: null,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : "Error en búsqueda",
        }));
      }
    }, 400);
  }, []);

  const clearSearch = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setState((s) => ({ ...s, searchQuery: "", searchResults: null, status: "ready" }));
  }, []);

  // ─── Disconnect ───────────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    await fetch("/api/drive/disconnect", { method: "POST" });
    setState({
      status: "no-token",
      items: [],
      currentFolder: null,
      breadcrumb: [],
      searchQuery: "",
      searchResults: null,
      nextPageToken: null,
      error: null,
      connected: false,
    });
  }, []);

  // ─── Open file ────────────────────────────────────────────────────────────────

  const openFile = useCallback((item: DriveItem) => {
    if (item.isFolder) {
      enterFolder(item);
    } else if (item.webViewLink) {
      window.open(item.webViewLink, "_blank", "noopener,noreferrer");
    }
  }, [enterFolder]);

  return {
    ...state,
    loadRoot,
    enterFolder,
    navigateTo,
    search,
    clearSearch,
    disconnect,
    openFile,
    refresh: loadRoot,
  };
}
