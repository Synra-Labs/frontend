// src/app/modify/page.tsx
// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import SliderControl from "@/components/SliderControl";
import "@/app/styles/ModifyModelPage.css";
import Footer from "@/components/Footer";

function useApiBase() {
  return useMemo(
    () =>
      (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8080"
      ).replace(/\/+$/, ""),
    []
  );
}

export default function ModifyModelPage() {
  const { selectedModel, setIsModified, sessionId } = useModel();
  const router = useRouter();
  const apiBase = useApiBase();

  const [mode, setMode] = useState<"standard" | "advanced">("standard");

  // standard fields
  const [temperature, setTemperature] = useState(0.7);
  const [tokenLimit, setTokenLimit] = useState(256);
  const [instructions, setInstructions] = useState("");
  const [topP, setTopP] = useState<string>("");
  const [topK, setTopK] = useState<string>("");
  const [stopCSV, setStopCSV] = useState<string>("");
  const [prewarm, setPrewarm] = useState(true);

  // advanced JSON
  const [advancedJSON, setAdvancedJSON] = useState(
    JSON.stringify(
      {
        temperature: 0.7,
        tokenLimit: 256,
        instructions: "",
        topP: null,
        topK: null,
        stop: [],
      },
      null,
      2
    )
  );

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // hydrate from backend config if exists
  useEffect(() => {
    if (!selectedModel) return;
    (async () => {
      try {
        const { data } = await axios.get(`${apiBase}/config`, {
          params: { model_id: selectedModel },
          headers: { "X-Session-Id": sessionId },
        });
        const cfg = data?.config || {};
        if (cfg) {
          setTemperature(parseFloat(cfg.temperature ?? 0.7));
          setTokenLimit(parseInt(cfg.max_tokens ?? 256));
          setInstructions(String(cfg.instructions ?? ""));
          setTopP(cfg.top_p === "" || cfg.top_p == null ? "" : String(cfg.top_p));
          setTopK(cfg.top_k === "" || cfg.top_k == null ? "" : String(cfg.top_k));
          if (cfg.stop) {
            try {
              const arr = Array.isArray(cfg.stop) ? cfg.stop : JSON.parse(cfg.stop);
              setStopCSV(arr.join(", "));
            } catch {
              setStopCSV("");
            }
          }
        }
      } catch {
        // ignore — first-time visit
      }
    })();
  }, [selectedModel, apiBase, sessionId]);

  const effectiveModelId = selectedModel || ""; // modify page expects a chosen model

  const buildPayload = () => {
    if (mode === "advanced") {
      let payload = {};
      try {
        payload = JSON.parse(advancedJSON);
      } catch {
        throw new Error("Invalid JSON in advanced mode.");
      }
      return { modelId: effectiveModelId, ...payload };
    } else {
      const stopArr = stopCSV
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        modelId: effectiveModelId,
        temperature: Number(temperature),
        tokenLimit: Number(tokenLimit),
        instructions,
        topP: topP === "" ? null : Number(topP),
        topK: topK === "" ? null : Number(topK),
        stop: stopArr.length ? stopArr : undefined,
      };
    }
  };

  const handleModify = async () => {
    setError("");
    if (!effectiveModelId) {
      alert("Please select a model first.");
      return;
    }

    let payload: any;
    try {
      payload = buildPayload();
    } catch (e: any) {
      return alert(e.message || "Invalid form.");
    }

    // fancy progress for the “real modify” feel
    setIsLoading(true);
    setProgress(0);

    // Simulated duration (fast enough to test): ~25–40s
    const duration = 25000 + Math.random() * 15000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(99, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 99) return;
      setTimeout(tick, 300);
    };
    setTimeout(tick, 300);

    try {
      const { data } = await axios.post(
        `${apiBase}/modify-file`,
        payload,
        {
          params: { prewarm: prewarm ? 1 : 0 },
          headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
          timeout: 120000,
        }
      );

      setProgress(100);
      if (data?.success) {
        setIsModified(true);
        alert("✅ Model settings applied.");
        router.push("/chat");
      } else {
        setError("Modify failed. Check backend logs.");
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err.message || "Unknown error";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadConfig = async () => {
    if (!effectiveModelId) return;
    try {
      const resp = await fetch(
        `${apiBase}/config/download?model_id=${encodeURIComponent(
          effectiveModelId
        )}`,
        { headers: { "X-Session-Id": sessionId } }
      );
      if (!resp.ok) return alert("No config available to download yet.");
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${effectiveModelId}-config.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      alert(e.message || "Download failed.");
    }
  };

  const handleLoadLocalIfFT = async () => {
    // If user has a fine-tuned model (id starts with ft-), load it into GPU RAM
    if (!effectiveModelId.startsWith("ft-")) {
      return alert("This action is only for fine-tuned models (ft-...).");
    }
    try {
      const url = `${apiBase}/load-local?model_id=${encodeURIComponent(
        effectiveModelId
      )}`;
      const { data } = await axios.get(url, {
        headers: { "X-Session-Id": sessionId },
      });
      if (data?.success) alert("✅ Loaded locally.");
    } catch (e: any) {
      alert(e?.response?.data?.detail || e.message || "Load failed.");
    }
  };

  if (!selectedModel) {
    return (
      <div className="modify-model-page container">
        <h2>No Model Selected</h2>
        <p>
          Please go to <a href="/models">Model Selection</a> first and pick one.
        </p>
      </div>
    );
  }

  return (
    <div className="modify-model-page container">
      <h2>Modify <code>{effectiveModelId}</code></h2>

      <p className="modify-subtitle">
        Tune how the model behaves. Settings are saved per-session and applied at inference.
      </p>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === "standard" ? "active" : ""}`}
          onClick={() => setMode("standard")}
          disabled={isLoading}
        >
          Standard
        </button>
        <button
          className={`mode-btn ${mode === "advanced" ? "active" : ""}`}
          onClick={() => setMode("advanced")}
          disabled={isLoading}
        >
          Advanced JSON
        </button>
      </div>

      {mode === "standard" ? (
        <div className="standard-interface">
          <SliderControl
            label="Creativity (Temperature)"
            min={0} max={1} step={0.01}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            description="Higher = more diverse output."
            disabled={isLoading}
          />
          <SliderControl
            label="Token Limit"
            min={64} max={2048} step={1}
            value={tokenLimit}
            onChange={(e) => setTokenLimit(parseInt(e.target.value))}
            description="Max tokens to generate for each response."
            disabled={isLoading}
          />
          <div className="toggle-control">
            <label>Top-p (optional):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={topP}
              onChange={(e) => setTopP(e.target.value)}
              placeholder="e.g. 0.9"
              disabled={isLoading}
            />
          </div>
          <div className="toggle-control">
            <label>Top-k (optional):</label>
            <input
              type="number"
              step="1"
              min="1"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              placeholder="e.g. 40"
              disabled={isLoading}
            />
          </div>
          <div className="instructions-control">
            <label>System Instructions:</label>
            <textarea
              placeholder='E.g. "You are a finance compliance assistant…"'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="instructions-control">
            <label>Stop Sequences (comma-separated, optional):</label>
            <input
              type="text"
              placeholder="e.g. ###, User:, Assistant:"
              value={stopCSV}
              onChange={(e) => setStopCSV(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="toggle-control" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              id="prewarm"
              type="checkbox"
              checked={prewarm}
              onChange={(e) => setPrewarm(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="prewarm">Pre-load model now (faster first chat)</label>
          </div>
        </div>
      ) : (
        <div className="advanced-json">
          <label>Advanced JSON:</label>
          <textarea
            rows={10}
            value={advancedJSON}
            onChange={(e) => setAdvancedJSON(e.target.value)}
            disabled={isLoading}
          />
          <small className="json-hint">
            Must include fields like <code>temperature</code>, <code>tokenLimit</code>, <code>instructions</code>.
          </small>
        </div>
      )}

      <div className="button-group">
        {isLoading ? (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <p>{progress}%</p>
          </div>
        ) : (
          <>
            <button onClick={handleModify} className="btn modify-btn">
              Apply Settings
            </button>
            <button onClick={handleDownloadConfig} className="btn modify-btn" style={{ marginLeft: 10 }}>
              Download Config
            </button>
            <button onClick={handleLoadLocalIfFT} className="btn modify-btn" style={{ marginLeft: 10 }}>
              Load Fine-tune (ft-…)
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="success-banner" style={{ background: "#402727", color: "#ffdcdc" }}>
          {error}
        </div>
      )}

      <Footer />
    </div>
  );
}
