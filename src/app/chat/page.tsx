// src/app/chat/page.tsx
// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ChatPage.css";
import Footer from "@/components/Footer";

type Msg = { role: "user" | "bot"; message: string };

function sid() {
  if (typeof window === "undefined") return "server";
  const k = "nspire_session_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
    localStorage.setItem(k, v);
  }
  return v;
}

export default function ChatPage() {
  const { selectedModel } =
    (useModel() as { selectedModel?: string | null }) || {};
  const [modelIdOverride, setModelIdOverride] = useState("");
  const effectiveModelId = useMemo(
    () => (modelIdOverride || selectedModel || "").trim(),
    [modelIdOverride, selectedModel]
  );

  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);
  const [source, setSource] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const apiBase = useMemo(() => {
    const env =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "";
    if (env) return env.replace(/\/+$/, "");
    if (typeof window !== "undefined") {
      const dev =
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("127.0.0.1");
      return dev ? "http://localhost:8080" : ""; // if empty in prod -> show banner
    }
    return "";
  }, []);

  const backendConfigured =
    !!apiBase && (!apiBase.includes("localhost") || typeof window === "undefined" || window.location.hostname.includes("localhost"));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = async () => {
    setError("");
    if (!prompt.trim()) return;
    if (!effectiveModelId) {
      setError("Please select or type a model ID first.");
      return;
    }
    if (!backendConfigured) {
      setError(
        "Backend URL not set. In Vercel, set NEXT_PUBLIC_API_URL to your Railway API URL."
      );
      return;
    }

    const userMsg = prompt;
    setChatHistory((h) => [...h, { role: "user", message: userMsg }]);
    setPrompt("");
    setSending(true);

    try {
      const { data } = await axios.post(
        `${apiBase}/run`,
        { modelId: effectiveModelId, prompt: userMsg },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id": sid(),
          },
          timeout: 120000,
        }
      );
      setSource(data?.source || "");
      setChatHistory((h) => [...h, { role: "bot", message: data?.response || "" }]);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Backend unavailable.";
      setError(detail);
      setChatHistory((h) => [...h, { role: "bot", message: `❌ ${detail}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setChatHistory([]);
    setSource("");
    setError("");
  };

  return (
    <div className="chat-page container">
      {!backendConfigured && (
        <div
          style={{
            background: "#221",
            color: "#ffeb3b",
            border: "1px solid #ffeb3b",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          Missing <code>NEXT_PUBLIC_API_URL</code>. Set it to your Railway API
          URL in Vercel. (Currently falling back to{" "}
          {apiBase || "no backend"}).
        </div>
      )}

      <h2>
        Chat with{" "}
        {effectiveModelId ? <code>{effectiveModelId}</code> : "your model"}
      </h2>

      {!selectedModel && (
        <div className="mb-20" style={{ width: "100%", maxWidth: 800 }}>
          <input
            className="input"
            placeholder="Model ID (ft-... or HF id, e.g. microsoft/Phi-3-mini-4k-instruct)"
            value={modelIdOverride}
            onChange={(e) => setModelIdOverride(e.target.value)}
          />
        </div>
      )}

      <div className="chat-history">
        {chatHistory.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.message}
          </div>
        ))}
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
        <button
          onClick={handleSend}
          className="btn chat-send-btn"
          disabled={sending || !effectiveModelId}
        >
          {sending ? "Sending…" : "Send"}
        </button>
        <button
          onClick={handleClear}
          className="btn chat-send-btn"
          disabled={sending}
          style={{ opacity: 0.85 }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="mt-20" style={{ fontSize: 12, color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      <Footer />
    </div>
  );
}

