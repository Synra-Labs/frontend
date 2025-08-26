// src/app/chat/page.tsx
// @ts-nocheck
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ChatPage.css";
import Footer from "@/components/Footer";

type Msg = { role: "user" | "bot"; message: string };

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const k = "nspire_session_id";
  let v = localStorage.getItem(k);
  if (!v) { v = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) as string; localStorage.setItem(k, v); }
  return v;
}

export default function ChatPage() {
  const { selectedModel } = (useModel() as { selectedModel?: string | null }) || {};
  const [modelIdOverride, setModelIdOverride] = useState("");
  const effectiveModelId = useMemo(() => (modelIdOverride || selectedModel || "").trim(), [modelIdOverride, selectedModel]);

  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const apiBase = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, ""),
    []
  );

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const handleSend = async () => {
    setError("");
    if (!prompt.trim()) return;
    if (!effectiveModelId) { setError("Select or type a model id first."); return; }

    const userMsg = prompt;
    setChatHistory(h => [...h, { role: "user", message: userMsg }]);
    setPrompt(""); setSending(true);

    try {
      const { data } = await axios.post(
        `${apiBase}/run`,
        { modelId: effectiveModelId, prompt: userMsg },
        { headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() }, timeout: 120000 }
      );
      setChatHistory(h => [...h, { role: "bot", message: data?.response || "" }]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Backend unavailable.";
      setError(detail);
      setChatHistory(h => [...h, { role: "bot", message: `❌ ${detail}` }]);
    } finally { setSending(false); }
  };

  const handleClear = () => { setChatHistory([]); setError(""); };

  return (
    <div className="chat-page container">
      <h2>Chat with {effectiveModelId ? <code>{effectiveModelId}</code> : "your model"}</h2>

      {!selectedModel && (
        <div className="mb-20" style={{ width: "100%", maxWidth: 800 }}>
          <input
            className="input"
            placeholder="Model ID (e.g. HuggingFaceH4/zephyr-7b-beta)"
            value={modelIdOverride}
            onChange={(e) => setModelIdOverride(e.target.value)}
          />
        </div>
      )}

      <div className="chat-history">
        {chatHistory.map((m, i) => (<div key={i} className={`chat-bubble ${m.role}`}>{m.message}</div>))}
        {sending && <div className="chat-bubble bot">…thinking</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask anything…"
          disabled={sending}
        />
        <button onClick={handleSend} className="btn chat-send-btn" disabled={sending || !effectiveModelId}>
          {sending ? "Sending…" : "Send"}
        </button>
        <button onClick={handleClear} className="btn chat-send-btn" disabled={sending} style={{ opacity: 0.85 }}>
          Clear
        </button>
      </div>

      {error && <div className="mt-20" style={{ fontSize: 12, color: "#ff6b6b" }}>{error}</div>}
      <Footer />
    </div>
  );
}
