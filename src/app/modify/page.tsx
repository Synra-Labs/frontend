// src/app/modify/page.tsx
// @ts-nocheck
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import SliderControl from "@/components/SliderControl";
import "@/app/styles/ModifyModelPage.css";
import Footer from "@/components/Footer";

export default function ModifyModelPage() {
  const { selectedModel, setIsModified } = useModel();
  const router = useRouter();

  // UI state
  const [mode, setMode] = useState<"standard" | "advanced">("standard");
  const [temperature, setTemperature] = useState(0.7);
  const [tokenLimit, setTokenLimit] = useState(256);
  const [instructions, setInstructions] = useState("");
  const [advancedJSON, setAdvancedJSON] = useState(
    `{"temperature":0.7,"tokenLimit":256,"instructions":""}`
  );

  const [prewarm, setPrewarm] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // backend base (no unexpected localhost in prod)
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
      return dev ? "http://localhost:8080" : ""; // empty means: not configured
    }
    return "";
  }, []);

  const tickTo = (msTotal: number) => {
    // smooth progress to 100% over msTotal
    const start = Date.now();
    setProgress(0);
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / msTotal) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setIsWorking(false);
        setIsModified(true);
        // no annoying alert; just go chat once it *visibly* hits 100
        router.push("/chat");
      }
    }, 150);
  };

  const handleSave = async () => {
    setError("");

    if (!selectedModel) {
      setError("Please select a model first on the Models page.");
      return;
    }
    if (!apiBase) {
      setError(
        "Backend URL not configured. Set NEXT_PUBLIC_API_URL on Vercel to your Railway API."
      );
      return;
    }

    // Build payload
    let payload: any;
    if (mode === "advanced") {
      try {
        payload = JSON.parse(advancedJSON);
      } catch {
        setError("Invalid JSON in Advanced mode.");
        return;
      }
      payload.modelId = selectedModel;
    } else {
      payload = {
        modelId: selectedModel,
        temperature,
        tokenLimit,
        instructions,
      };
    }

    setIsWorking(true);
    setProgress(0);

    try {
      // Save config (and optionally prewarm); this may return fast,
      // but we **do not** show "ready" until our progress bar finishes.
      await axios.post(
        `${apiBase}/modify-file?prewarm=${prewarm ? 1 : 0}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id":
              (typeof window !== "undefined" &&
                (localStorage.getItem("nspire_session_id") ||
                  (crypto?.randomUUID?.() ??
                    `${Date.now()}-${Math.random()}`))) ||
              "server",
          },
          timeout: 120000,
        }
      );

      // Let the bar complete *visibly*, then route to /chat.
      // If prewarm is on, show a bit longer bar to feel legit.
      tickTo(prewarm ? 25000 : 4000);
    } catch (err: any) {
      setIsWorking(false);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save settings.";
      setError(detail);
    }
  };

  if (!selectedModel) {
    return (
      <div className="modify-model-page container">
        <h2>No Model Selected</h2>
        <p>
          Go to <a href="/models">Models</a> and pick one first.
        </p>
      </div>
    );
  }

  return (
    <div className="modify-model-page container">
      <h2>Modify {selectedModel}</h2>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === "standard" ? "active" : ""}`}
          onClick={() => setMode("standard")}
          disabled={isWorking}
        >
          Standard
        </button>
        <button
          className={`mode-btn ${mode === "advanced" ? "active" : ""}`}
          onClick={() => setMode("advanced")}
          disabled={isWorking}
        >
          Advanced
        </button>
      </div>

      {mode === "standard" ? (
        <div className="standard-interface">
          <SliderControl
            label="Creativity (Temperature)"
            min={0}
            max={1}
            step={0.01}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            description="Higher = more creative. Lower = more focused."
            disabled={isWorking}
          />
          <SliderControl
            label="Token Limit"
            min={128}
            max={4096}
            step={1}
            value={tokenLimit}
            onChange={(e) => setTokenLimit(parseInt(e.target.value))}
            description="Max tokens returned per answer."
            disabled={isWorking}
          />
          <div className="instructions-control">
            <label>Additional Instructions</label>
            <textarea
              placeholder="e.g. You are a concise, friendly assistant for retail traders."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isWorking}
            />
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={prewarm}
              onChange={(e) => setPrewarm(e.target.checked)}
              disabled={isWorking}
            />
            Pre-load model now (faster first answer)
          </label>
        </div>
      ) : (
        <div className="advanced-json">
          <label>Advanced JSON</label>
          <textarea
            rows={10}
            value={advancedJSON}
            onChange={(e) => setAdvancedJSON(e.target.value)}
            disabled={isWorking}
          />
          <small className="json-hint">
            Example: {"{\"temperature\":0.7,\"tokenLimit\":256,\"instructions\":\"You are helpful.\"}"}
          </small>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={prewarm}
                onChange={(e) => setPrewarm(e.target.checked)}
                disabled={isWorking}
              />
              Pre-load model now (faster first answer)
            </label>
          </div>
        </div>
      )}

      {/* Progress (only shown while saving) */}
      {isWorking && (
        <div className="progress-bar-container" style={{ marginTop: 16 }}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p>{progress}%</p>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 14,
            color: "#ff6b6b",
            fontSize: 13,
            wordBreak: "break-word",
          }}
        >
          {error}
        </div>
      )}

      <div className="button-group" style={{ marginTop: 18 }}>
        <button className="btn modify-btn" onClick={handleSave} disabled={isWorking}>
          {isWorking ? "Saving…" : "Save & Continue"}
        </button>
      </div>

      <Footer />
    </div>
  );
}
