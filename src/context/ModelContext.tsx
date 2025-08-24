"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  selectedModel: string | null;
  setSelectedModel: (m: string | null) => void;
  isModified: boolean;
  setIsModified: (b: boolean) => void;
  sessionId: string;
  reset: () => void;
};

const ModelContext = createContext<Ctx>({
  selectedModel: null, setSelectedModel: () => {},
  isModified: false, setIsModified: () => {},
  sessionId: "server", reset: () => {},
});

function ensureSessionId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "nspire_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) { id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString(); localStorage.setItem(KEY, id); }
  return id;
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState("server");
  useEffect(() => { setSessionId(ensureSessionId()); }, []);

  const [selectedModel, _setSelectedModel] = useState<string | null>(null);
  const [isModified, _setIsModified] = useState(false);

  const storage = useMemo(() => ({
    model: `nspire:${sessionId}:selectedModel`,
    modified: `nspire:${sessionId}:isModified`
  }), [sessionId]);

  useEffect(() => {
    if (sessionId === "server") return;
    const m = localStorage.getItem(storage.model);
    const mod = localStorage.getItem(storage.modified);
    if (m) _setSelectedModel(m);
    if (mod !== null) _setIsModified(mod === "1");
  }, [sessionId, storage.model, storage.modified]);

  const setSelectedModel = (m: string | null) => {
    _setSelectedModel(m);
    if (sessionId !== "server") {
      if (m) localStorage.setItem(storage.model, m);
      else localStorage.removeItem(storage.model);
    }
  };
  const setIsModified = (b: boolean) => {
    _setIsModified(b);
    if (sessionId !== "server") localStorage.setItem(storage.modified, b ? "1" : "0");
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storage.model) _setSelectedModel(e.newValue);
      if (e.key === storage.modified) _setIsModified(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storage.model, storage.modified]);

  const reset = () => { setSelectedModel(null); setIsModified(false); };
  const value = useMemo(() => ({ selectedModel, setSelectedModel, isModified, setIsModified, sessionId, reset }),
    [selectedModel, isModified, sessionId]);

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() { return useContext(ModelContext); }
