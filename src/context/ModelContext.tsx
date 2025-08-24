// src/context/ModelContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type ModelContextType = {
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  isModified: boolean;
  setIsModified: (val: boolean) => void;
  sessionId: string;      // stable per-browser ID (use for X-Session-Id)
  reset: () => void;      // clears model + modified flags
};

const ModelContext = createContext<ModelContextType>({
  selectedModel: null,
  setSelectedModel: () => {},
  isModified: false,
  setIsModified: () => {},
  sessionId: "server",
  reset: () => {},
});

function ensureSessionId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "nspire_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    // crypto.randomUUID is widely supported in modern browsers
    id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function ModelProvider({ children }: { children: ReactNode }) {
  // sessionId first (hydrated on client)
  const [sessionId, setSessionId] = useState<string>("server");
  useEffect(() => {
    setSessionId(ensureSessionId());
  }, []);

  // local state
  const [selectedModel, _setSelectedModel] = useState<string | null>(null);
  const [isModified, _setIsModified] = useState<boolean>(false);

  // storage keys derived from session (namespaced so you could support multiple)
  const storageKeys = useMemo(() => {
    const sid = sessionId || "server";
    return {
      model: `nspire:${sid}:selectedModel`,
      modified: `nspire:${sid}:isModified`,
    };
  }, [sessionId]);

  // hydrate from localStorage once sessionId is known
  useEffect(() => {
    if (sessionId === "server") return;
    try {
      const m = localStorage.getItem(storageKeys.model);
      const mod = localStorage.getItem(storageKeys.modified);
      if (m) _setSelectedModel(m);
      if (mod !== null) _setIsModified(mod === "1");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // setters that persist
  const setSelectedModel = (m: string | null) => {
    _setSelectedModel(m);
    try {
      if (sessionId !== "server") {
        if (m) localStorage.setItem(storageKeys.model, m);
        else localStorage.removeItem(storageKeys.model);
      }
    } catch {}
  };

  const setIsModified = (b: boolean) => {
    _setIsModified(b);
    try {
      if (sessionId !== "server") {
        localStorage.setItem(storageKeys.modified, b ? "1" : "0");
      }
    } catch {}
  };

  // cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === storageKeys.model) _setSelectedModel(e.newValue);
      if (e.key === storageKeys.modified) _setIsModified(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKeys.model, storageKeys.modified]);

  const reset = () => {
    setSelectedModel(null);
    setIsModified(false);
  };

  const value = useMemo(
    () => ({
      selectedModel,
      setSelectedModel,
      isModified,
      setIsModified,
      sessionId,
      reset,
    }),
    [selectedModel, isModified, sessionId]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  return useContext(ModelContext);
}
