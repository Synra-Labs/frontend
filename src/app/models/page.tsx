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
    { id: "TinyLlama", name: "TinyLlama 1.1B Chat", repo: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
      description: "Fast, lightweight — great for testing." },
    { id: "Mistral7B", name: "Mistral 7B", repo: "mistralai/Mistral-7B-v0.1",
      description: "Stronger responses, heavier to run." },
    { id: "Falcon7B", name: "Falcon 7B", repo: "tiiuae/falcon-7b",
      description: "Solid general model." },
    { id: "GPTJ6B", name: "GPT-J 6B", repo: "EleutherAI/gpt-j-6B",
      description: "Classic open model." },
  ];

  const handleSelect = (repo: string) => {
    setSelectedModel(repo);
    setIsModified(false);
    router.push("/modify"); // auto-navigate to modify
  };

  return (
    <div className="models-page container">
      <h2>Pick a Model</h2>
      <ul className="models-list">
        {models.map((m) => (
          <li key={m.id} onClick={() => handleSelect(m.repo)}>
            <h3>{m.name}</h3>
            <p>{m.description}</p>
            <small style={{ opacity: 0.7 }}>{m.repo}</small>
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
}
