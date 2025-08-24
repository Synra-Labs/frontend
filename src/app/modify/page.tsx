// app/modify/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import SliderControl from "@/components/SliderControl";
import "@/app/styles/ModifyModelPage.css";
import Footer from "@/components/Footer";

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

export default function ModifyModelPage() {
  const { selectedModel, setIsModified } = useModel() as {
    selectedModel?: string;
    setIsModified: (b: boolean) => void;
  };
  const router = useRouter();

  const backendUrl = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
        /\/+$/,
        ""
      ),
    []
  );

  const [mode, setMode] = useState<"standard" | "advanced">("standard");
  const [temperature, setTemperature] = useState(0.5);
  const [tokenLimit, setTokenLimit] = useState(512);
  const [instructions, setInstructions] = useState("");
  const [advancedJSON, setAdvancedJSON] = useState(
    `{"temperature":0.5,"tokenLimit":512,"instructions":""}`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  async function handleModify() {
    setErrMsg("");
    if (!selectedModel) {
      alert("Please select a model first.");
      return;
    }

    // Build payload
    let payload: any;
    if (mode === "advanced") {
      try {
        const parsed = JSON.parse(advancedJSON);
        payload = { ...parsed, modelId: selectedModel };
      } catch {
        setErrMsg("Invalid JSON in advanced mode.");
        return;
      }
    } else {
      payload = {
        modelId: selectedModel,
        temperature,
        tokenLimit,
        instructions,
      };
    }

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/modify-file`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id": getSessionId(),
          },
        }
      );

      if (data?.success) {
        setIsModified(true);
        router.push("/chat");
      } else {
        setErrMsg(typeof data === "string" ? data : "Modify failed");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || "Unknown error";
      setErrMsg(detail);
    } finally {
      setIsLoading(false);
    }
  }

  if (!selectedModel) {
    return (
      <div className="modify-model-page container">
        <h2>No Model Selected</h2>
        <p>
          Please go to <a href="/models">Model Selection</a> first.
        </p>
      </div>
    );
  }

  return (
    <div className="modify-model-page container">
      <h2>Modify <code>{selectedModel}</code></h2>

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
          Advanced
        </button>
      </div>

      {mode === "standard" ? (
        <div className="standard-interface">
          <SliderControl
            label="Creativity (Temperature)"
            min={0} max={2} step={0.01}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            description="Adjust how creative responses are."
            disabled={isLoading}
          />
          <SliderControl
            label="Token Limit"
            min={64} max={4096} step={1}
            value={tokenLimit}
            onChange={e => setTokenLimit(parseInt(e.target.value))}
            description="Set maximum tokens per response."
            disabled={isLoading}
          />
          <div className="instructions-control">
            <label>System Instructions</label>
            <textarea
              placeholder="E.g. You are a concise finance compliance assistant."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="advanced-json">
          <label>Enter Advanced JSON:</label>
          <textarea
            rows={8}
            value={advancedJSON}
            onChange={e => setAdvancedJSON(e.target.value)}
            disabled={isLoading}
          />
          <small className="json-hint">
            Example: {"{\"temperature\":0.7,\"tokenLimit\":256,\"instructions\":\"Be brief.\"}"}
          </small>
        </div>
      )}

      {errMsg && (
        <div className="error mt-2">
          ❌ {errMsg}
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleModify}
          className="btn modify-btn"
          disabled={isLoading}
        >
          {isLoading ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <Footer />
    </div>
  );
}
