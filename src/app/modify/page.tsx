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
  const [temperature, setTemperature] = useState(0.7);
  const [tokenLimit, setTokenLimit] = useState(256);
  const [instructions, setInstructions] = useState("");
  const [topP, setTopP] = useState<string>("");
  const [topK, setTopK] = useState<string>("");
  const [stopCSV, setStopCSV] = useState<string>("");
  const [prewarm, setPrewarm] = useState(true);

  const [advancedJSON, setAdvancedJSON] = useState(
    JSON.stringify({ temperature: 0.7, tokenLimit: 256, instructions: "", topP: null, topK: null, stop: [] }, null, 2)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

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
            } catch { setStopCSV(""); }
          }
        }
      } catch {}
    })();
  }, [selectedModel, apiBase, sessionId]);

  const buildPayload = () => {
    if (mode === "advanced") {
      const j = JSON.parse(advancedJSON);
      return { modelId: selectedModel, ...j };
    } else {
      const stopArr = stopCSV.split(",").map(s => s.trim()).filter(Boolean);
      return {
        modelId: selectedModel,
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
    if (!selectedModel) return alert("Pick a model first.");

    let payload: any;
    try { payload = buildPayload(); } catch { return alert("Invalid JSON."); }

    setIsLoading(true); setProgress(0);
    const duration = 20000 + Math.random() * 10000;
    const start = Date.now();
    const tick = () => {
      const pct = Math.min(99, Math.round(((Date.now() - start) / duration) * 100));
      setProgress(pct);
      if (pct < 99) setTimeout(tick, 250);
    };
    setTimeout(tick, 250);

    try {
      const { data } = await axios.post(
        `${apiBase}/modify-file`,
        payload,
        { params: { prewarm: prewarm ? 1 : 0 },
          headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
          timeout: 120000 }
      );
      setProgress(100);
      if (data?.success) {
        setIsModified(true);
        alert("Settings saved. You're ready to chat.");
        router.push("/chat");
      } else {
        setError("Modify failed. Try again.");
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadConfig = async () => {
    if (!selectedModel) return;
    const resp = await fetch(`${apiBase}/config/download?model_id=${encodeURIComponent(selectedModel)}`, {
      headers: { "X-Session-Id": sessionId },
    });
    if (!resp.ok) return alert("No config yet.");
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${selectedModel}-config.json`; a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleLoadFT = async () => {
    if (!selectedModel?.startsWith("ft-")) return alert("This is for fine-tuned models (ft-…).");
    try {
      await axios.get(`${apiBase}/load-local?model_id=${encodeURIComponent(selectedModel)}`, {
        headers: { "X-Session-Id": sessionId },
      });
      alert("Loaded to server memory. Chat will be snappy.");
    } catch (e: any) {
      alert(e?.response?.data?.detail || e.message || "Load failed.");
    }
  };

  if (!selectedModel) {
    return (
      <div className="modify-model-page container">
        <h2>No Model Selected</h2>
        <p>Go to <a href="/models">Models</a> and pick one.</p>
      </div>
    );
  }

  return (
    <div className="modify-model-page container">
      <h2>Adjust <code>{selectedModel}</code></h2>
      <p className="modify-subtitle">Simple controls. Changes affect the next reply immediately.</p>

      <div className="mode-toggle">
        <button className={`mode-btn ${mode === "standard" ? "active" : ""}`} onClick={() => setMode("standard")} disabled={isLoading}>Easy Mode</button>
        <button className={`mode-btn ${mode === "advanced" ? "active" : ""}`} onClick={() => setMode("advanced")} disabled={isLoading}>Advanced JSON</button>
      </div>

      {mode === "standard" ? (
        <div className="standard-interface">
          <SliderControl label="Creativity" min={0} max={1} step={0.01}
            value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
            description="Higher numbers = more varied answers." disabled={isLoading}/>
          <SliderControl label="Max Answer Length" min={64} max={2048} step={1}
            value={tokenLimit} onChange={e => setTokenLimit(parseInt(e.target.value))}
            description="Caps how long the answer can be." disabled={isLoading}/>
          <div className="toggle-control">
            <label>Extra Rules (optional)</label>
            <textarea placeholder='Example: "Answer as a friendly tutor."' value={instructions} onChange={e => setInstructions(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="toggle-control">
            <label>Top-p (optional)</label>
            <input type="number" step="0.01" min="0" max="1" value={topP} onChange={e => setTopP(e.target.value)} placeholder="e.g. 0.9" disabled={isLoading}/>
          </div>
          <div className="toggle-control">
            <label>Top-k (optional)</label>
            <input type="number" step="1" min="1" value={topK} onChange={e => setTopK(e.target.value)} placeholder="e.g. 40" disabled={isLoading}/>
          </div>
          <div className="toggle-control">
            <label>Stop Phrases (comma separated)</label>
            <input type="text" value={stopCSV} onChange={e => setStopCSV(e.target.value)} placeholder="Example: ###, User:, Assistant:" disabled={isLoading}/>
          </div>
          <div className="toggle-control" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input id="prewarm" type="checkbox" checked={prewarm} onChange={e => setPrewarm(e.target.checked)} disabled={isLoading}/>
            <label htmlFor="prewarm">Pre-load model now (faster first answer)</label>
          </div>
        </div>
      ) : (
        <div className="advanced-json">
          <label>Advanced JSON</label>
          <textarea rows={10} value={advancedJSON} onChange={e => setAdvancedJSON(e.target.value)} disabled={isLoading}/>
          <small className="json-hint">Must include: temperature, tokenLimit, instructions. Optional: topP, topK, stop.</small>
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
            <button onClick={handleModify} className="btn modify-btn">Save Settings</button>
            <button onClick={handleDownloadConfig} className="btn modify-btn" style={{ marginLeft: 10 }}>Download Settings</button>
            <button onClick={handleLoadFT} className="btn modify-btn" style={{ marginLeft: 10 }}>Load Fine-tuned Model</button>
          </>
        )}
      </div>

      {error && <div className="success-banner" style={{ background: "#402727", color: "#ffdcdc" }}>{error}</div>}
      <Footer />
    </div>
  );
}
