"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { useModel } from "@/context/ModelContext"; // expects { selectedModel?: string }
import "@/app/styles/ChatPage.css";
import Footer from "@/components/Footer";

type Msg = { role: "user" | "bot"; message: string };

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

export default function ChatPage() {
  // your context; keep using selectedModel
  const { selectedModel } = useModel() as { selectedModel?: string };

  // allow a manual override if nothing is selected yet
  const [modelIdOverride, setModelIdOverride] = useState("");
  const effectiveModelId = useMemo(
    () => (modelIdOverride || selectedModel || "").trim(),
    [modelIdOverride, selectedModel]
  );

  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);
  const [source, setSource] = useState<string>("");
  const [sending, setSending] = useState(false);

  const backendUrl = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
        /\/+$/,
        ""
      ),
    []
  );

  const handleSend = async () => {
    if (!prompt.trim()) return;
    if (!effectiveModelId) {
      alert("Pick a model first (ft-... or a Hugging Face id).");
      return;
    }

    const userMsg = prompt;
    setChatHistory((h) => [...h, { role: "user", message: userMsg }]);
    setPrompt("");
    setSending(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/run`,
        { modelId: effectiveModelId, prompt: userMsg },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id": getSessionId(),
          },
        }
      );

      // backend returns { success, source, response }
      setSource(data.source || "");
      setChatHistory((h) => [...h, { role: "bot", message: data.response }]);
    } catch (err: any) {
      console.error("Chat error:", err.response || err.message);
      const detail = err?.response?.data?.detail || err.message || "Unknown error";
      setChatHistory((h) => [
        ...h,
        { role: "bot", message: `❌ Error: ${detail}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page container">
      <h2>
        Chat with{" "}
        {effectiveModelId ? (
          <code>{effectiveModelId}</code>
        ) : (
          "your model"
        )}
      </h2>

      {/* allow manual model id entry if none selected from Models/Train */}
      {!selectedModel && (
        <div className="mb-3">
          <input
            className="input"
            placeholder="Model ID (ft-... or HF id, e.g. TinyLlama/TinyLlama-1.1B-Chat-v1.0)"
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
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type your message…"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          className="btn chat-send-btn"
          disabled={sending}
          title={effectiveModelId ? "" : "Select or enter a model id first"}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      {source && (
        <div className="mt-2 text-xs opacity-70">
          source: <code>{source}</code>
        </div>
      )}

      <Footer />
    </div>
  );
}
