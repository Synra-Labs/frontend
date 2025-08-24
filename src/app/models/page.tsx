// src/app/models/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ModelsPage.css";
import Footer from "@/components/Footer";

type LocalModels = Record<string, { base_model_id?: string; type?: string; created?: number }>;

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const k = "nspire_session_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}

// Clean fallback list (only truly public)
const FALLBACK_BASE = [
  { name: "TinyLlama 1.1B Chat", repo: "TinyLlama/TinyLlama-1.1B-Chat-v1.0", description: "Tiny, fast, great for demos." },
  { name: "Mistral 7B",          repo: "mistralai/Mistral-7B-v0.1",            description: "Popular 7B base for LoRA." },
  { name: "Falcon 7B",           repo: "tiiuae/falcon-7b",                     description: "Solid 7B, permissive." },
  { name: "GPT-J 6B",            repo: "EleutherAI/gpt-j-6B",                  description: "Classic 6B open model." },
  { name: "GPT-Neo 2.7B",        repo: "EleutherAI/gpt-neo-2.7B",              description: "Small, public, quick." },
];

export default function ModelsPage() {
  const { setSelectedModel, setIsModified } = useModel() as {
    setSelectedModel: (id: string) => void;
    setIsModified: (b: boolean) => void;
  };
  const router = useRouter();

  const backendUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, ""),
    []
  );

  const [baseModels, setBaseModels] = useState<string[]>([]);
  const [localModels, setLocalModels] = useState<LocalModels>({});
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/models`, {
          headers: { "X-Session-Id": getSessionId() },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (cancelled) return;
        setBaseModels(data.baseModels || []);
        setLocalModels(data.localModels || {});
      } catch {
        if (cancelled) return;
        // API unavailable → show fallback list so the page still works
        setUseFallback(true);
      }
    })();
    return () => { cancelled = true; };
  }, [backendUrl]);

  const handleBaseSelect = (repo: string) => {
    // User is choosing a *base* model → go to TRAIN
    setSelectedModel(repo);
    setIsModified(false);
    router.push("/train");
  };

  const handleLocalSelect = (id: string) => {
    // User is choosing a trained model → go to CHAT (or Modify if you prefer)
    setSelectedModel(id);
    setIsModified(true);
    router.push("/chat");
  };

  return (
    <div className="models-page container">
      <h2>Select a Model</h2>

      {/* Base models section */}
      <section>
        <h3>Base (Hugging Face)</h3>
        <ul className="models-list">
          {useFallback
            ? FALLBACK_BASE.map((m) => (
                <li key={m.repo} onClick={() => handleBaseSelect(m.repo)}>
                  <h3>{m.name}</h3>
                  <p>{m.description}</p>
                  <code className="repo">{m.repo}</code>
                </li>
              ))
            : (baseModels.length
                ? baseModels.map((repo: string) => (
                    <li key={repo} onClick={() => handleBaseSelect(repo)}>
                      <h3>{repo.split("/").at(-1)}</h3>
                      <p>Public base model</p>
                      <code className="repo">{repo}</code>
                    </li>
                  ))
                : <li className="empty">Loading base models…</li>
              )
          }
        </ul>
      </section>

      {/* Your trained models */}
      <section style={{ marginTop: 24 }}>
        <h3>Your trained models (this session)</h3>
        <ul className="models-list">
          {Object.keys(localModels).length === 0 ? (
            <li className="empty">No trained models yet. Pick a base above and go to Train.</li>
          ) : (
            Object.entries(localModels).map(([id, meta]) => (
              <li key={id} onClick={() => handleLocalSelect(id)}>
                <h3>{id}</h3>
                <p>{meta?.type || "model"} • {meta?.base_model_id || "unknown base"}</p>
                <code className="repo">{meta?.base_model_id}</code>
              </li>
            ))
          )}
        </ul>
      </section>

      <Footer />
    </div>
  );
}
