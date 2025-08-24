// @ts-nocheck
"use client";
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/TrainPage.css";
import Footer from "@/components/Footer";

function useApiBase() {
  return useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, ""),
    []
  );
}

export default function TrainPage() {
  const { selectedModel, setSelectedModel, sessionId } = useModel();
  const router = useRouter();
  const apiBase = useApiBase();

  const [baseModelId, setBaseModelId] = useState(selectedModel || "TinyLlama/TinyLlama-1.1B-Chat-v1.0");
  const [useLora, setUseLora] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);

  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<"idle"|"in_progress"|"completed"|"failed">("idle");
  const [ftModelId, setFtModelId] = useState("");
  const [error, setError] = useState("");

  const startFakeProgress = () => {
    setProgress(0);
    const id = setInterval(() => { setProgress(p => Math.min(95, p + Math.random() * 7)); }, 900);
    return () => clearInterval(id);
  };

  const handleTrain = async () => {
    setError("");
    if (!files?.length) return alert("Please select training files (.txt, .md, .json, .csv).");

    const cleanup = startFakeProgress();
    setIsTraining(true); setStatus("in_progress");

    try {
      const form = new FormData();
      form.append("base_model_id", baseModelId);
      form.append("use_lora", String(useLora));
      for (let i = 0; i < files.length; i++) form.append("files", files[i]);

      const { data } = await axios.post(`${apiBase}/train`, form, {
        headers: { "X-Session-Id": sessionId }, timeout: 120000
      });
      if (data?.job_id) {
        setJobId(data.job_id);
        pollProgress(data.job_id, cleanup);
      } else {
        cleanup(); setIsTraining(false); setStatus("failed"); setError("Training did not start.");
      }
    } catch (e: any) {
      cleanup(); setIsTraining(false); setStatus("failed");
      setError(e?.response?.data?.detail || e.message || "Train error.");
    }
  };

  const pollProgress = async (jid: string, cleanup: () => void) => {
    try {
      const { data } = await axios.get(`${apiBase}/progress/${jid}`, { headers: { "X-Session-Id": sessionId }});
      if (data?.status === "completed") {
        cleanup(); setProgress(100); setIsTraining(false); setStatus("completed");
        const mid = data?.model_id || `ft-${jid}`;
        setFtModelId(mid);
        alert("✅ Training complete! Your fine-tuned model is ready.");
      } else if (data?.status === "in_progress") {
        setTimeout(() => pollProgress(jid, cleanup), 1500);
      } else {
        cleanup(); setIsTraining(false); setStatus("failed"); setError("Training failed.");
      }
    } catch {
      setTimeout(() => pollProgress(jid, cleanup), 2000);
    }
  };

  const handleDownloadModel = async () => {
    if (!ftModelId) return;
    try {
      const resp = await fetch(`${apiBase}/download-model?model_id=${encodeURIComponent(ftModelId)}`, {
        headers: { "X-Session-Id": sessionId }
      });
      if (!resp.ok) return alert("Model not ready.");
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `${ftModelId}.zip`; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) { alert(e.message || "Download failed."); }
  };

  const handleLoadAndChat = async () => {
    if (!ftModelId) return;
    try {
      await axios.get(`${apiBase}/load-local?model_id=${encodeURIComponent(ftModelId)}`, { headers: { "X-Session-Id": sessionId }});
    } catch {}
    setSelectedModel(ftModelId);
    router.push("/modify");
  };

  return (
    <div className="train-page container">
      <h2>Train Your Model</h2>

      <div className="train-form">
        <label>Base Model</label>
        <input type="text" value={baseModelId} onChange={e => setBaseModelId(e.target.value)}
          placeholder="e.g. TinyLlama/TinyLlama-1.1B-Chat-v1.0" />

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 20px" }}>
          <input id="uselora" type="checkbox" checked={useLora} onChange={e => setUseLora(e.target.checked)} />
          <label htmlFor="uselora">Use LoRA (faster, lighter)</label>
        </div>

        <label>Training Files</label>
        <input type="file" multiple accept=".txt,.md,.json,.csv" onChange={e => setFiles(e.target.files)} />

        <div className="button-group">
          {!isTraining ? (
            <button onClick={handleTrain} className="btn train-btn">Start Training</button>
          ) : (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <p>{Math.round(progress)}% completed</p>
            </div>
          )}
        </div>

        {status === "completed" && ftModelId && (
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleLoadAndChat} className="btn train-btn">Load & Chat ({ftModelId})</button>
            <button onClick={handleDownloadModel} className="btn train-btn">Download Model (.zip)</button>
          </div>
        )}

        {error && <div className="success-banner" style={{ background: "#402727", color: "#ffdcdc", marginTop: 16 }}>{error}</div>}
      </div>

      <Footer />
    </div>
  );
}
