// src/app/models/page.tsx
// @ts-nocheck
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ModelsPage.css";
import Footer from "@/components/Footer";

export default function ModelsPage() {
  const { setSelectedModel, setIsModified } = useModel();
  const router = useRouter();

  const models = [
    { id: "Zephyr7B", name: "Zephyr 7B Beta", repo: "HuggingFaceH4/zephyr-7b-beta",
      description: "Reliable on HF Inference; great default." },
    { id: "Gemma2-2B", name: "Gemma 2 (2B, IT)", repo: "google/gemma-2-2b-it",
      description: "Small instruction-tuned; may require license acceptance." },
    { id: "Mistral7B", name: "Mistral 7B Instruct v0.2", repo: "mistralai/Mistral-7B-Instruct-v0.2",
      description: "Heavier; sometimes gated on HF Inference." },
    { id: "Falcon7B", name: "Falcon 7B Instruct", repo: "tiiuae/falcon-7b-instruct",
      description: "Classic instruct model; may require license." },
    { id: "TinyLlama", name: "TinyLlama 1.1B Chat", repo: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
      description: "Very light; not always available on serverless." },
  ];

  const handleSelect = (repo: string) => {
    setSelectedModel(repo);
    setIsModified(false);
    router.push("/modify"); // go straight to modify
  };

  return (
    <div className="models-page container">
      <h2>Select a Base Model</h2>
      <ul className="models-list">
        {models.map((m) => (
          <li key={m.id} onClick={() => handleSelect(m.repo)}>
            <h3>{m.name}</h3>
            <p>{m.description}</p>
            <small style={{ opacity: 0.6 }}>{m.repo}</small>
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
}
