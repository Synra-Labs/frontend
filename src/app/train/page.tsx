// app/train/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "@/app/styles/TrainPage.css";
import Footer from "@/components/Footer";
import { useModel } from "@/context/ModelContext";

type BaseModelsResp = { baseModels: string[]; localModels: Record<string, any> };

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

export default function TrainPage() {
  // from your context: selectedModel is used to carry the chosen *base* from /models
  const { selectedModel, setSelectedModel, setIsModified } = useModel() as {
    selectedModel?: string;
    setSelectedModel: (id: string) => void;
    setIsModified: (b: boolean) => void;
  };

  // local UI state
  const [baseModel, setBaseModel] = useState<string>(selectedModel || "");
  const [availableBases, setAvailableBases] = useState<string[]>([]);
  const [objective, setObjective] = useState(""); // optional note; not sent to API
  const [files, setFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [readyModelId, setReadyModelId] = useState<string>("");

  const backendUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, ""),
    []
  );

  // Load base models (for convenience if user lands here directly)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<BaseModelsResp>(`${backendUrl}/models`, {
          headers: { "X-Session-Id": getSessionId() },
        });
        if (!cancelled) setAvailableBases(data.baseModels || []);
      } catch {
        if (!cancelled) setAvailableBases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;
    let active = true;
    const poll = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/progress/${jobId}`, {
          headers: { "X-Session-Id": getSessionId() },
        });
        if (!active) return;
        if (data.status === "in_progress") {
          setStatusText("Training in progress…");
          setTimeout(poll, 2500);
        } else if (data.status === "completed" && data.model_id) {
          const mid = data.model_id as string;
          setStatusText("Completed");
          setIsTraining(false);
          setReadyModelId(mid);
          // set the selected model to the trained one for the rest of the app
          setSelectedModel(mid);
          setIsModified(false);
        } else {
          setStatusText("Failed");
          setIsTraining(false);
        }
      } catch (e: any) {
        if (!active) return;
        setStatusText(e?.response?.data?.detail || e.message || "Error");
        setIsTraining(false);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [jobId, backendUrl, setIsModified, setSelectedModel]);

  const onStartTraining = async () => {
    if (!baseModel) {
      alert("Pick a base model (e.g., TinyLlama/TinyLlama-1.1B-Chat-v1.0).");
      return;
    }
    if (files.length === 0) {
      alert("Upload at least one text file.");
      return;
    }

    const fd = new FormData();
    fd.append("base_model_id", baseModel);
    fd.append("use_lora", String(true)); // cheaper + faster
    files.forEach((f) => fd.append("files", f));

    setIsTraining(true);
    setStatusText("Queuing job…");
    setReadyModelId("");
    setJobId("");

    try {
      const { data } = await axios.post(`${backendUrl}/train`, fd, {
        headers: { "X-Session-Id": getSessionId() }, // let axios set content-type boundary
      });
      if (data?.job_id) {
        setJobId(data.job_id);
        setStatusText("Queued");
      } else {
        setIsTraining(false);
        setStatusText("Could not start training.");
      }
    } catch (e: any) {
      setIsTraining(false);
      setStatusText(e?.response?.data?.detail || e.message || "Failed to start");
    }
  };

  return (
    <div className="train-page container">
      <h2>Train Your Model</h2>

      <div className="train-form">
        <label>Base Model</label>
        <input
          className="input"
          placeholder="e.g. TinyLlama/TinyLlama-1.1B-Chat-v1.0"
          value={baseModel}
          onChange={(e) => setBaseModel(e.target.value)}
          list="base-models"
          disabled={isTraining}
        />
        <datalist id="base-models">
          {availableBases.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <label>Optional Objective (note for yourself)</label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Describe what you want the model to learn…"
          disabled={isTraining}
        />

        <label>Dataset Files (text only)</label>
        <input
          type="file"
          multiple
          accept=".txt,.md,.csv,.json"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          disabled={isTraining}
        />

        <div className="button-group">
          {isTraining ? (
            <>
              <div className="progress-bar-container">
                {/* indeterminate bar since backend gives status, not percent */}
                <div className="progress-bar indeterminate" />
                <p>{statusText}</p>
                {jobId && <p className="mt-1 text-xs">Job ID: {jobId}</p>}
              </div>
            </>
          ) : (
            <button onClick={onStartTraining} className="btn train-btn">
              Start Training
            </button>
          )}
        </div>

        {readyModelId && (
          <div className="mt-4 success">
            ✅ Training complete. Your model ID is{" "}
            <code>{readyModelId}</code>. Head to <a href="/modify">Modify</a> or{" "}
            <a href="/chat">Chat</a>.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
