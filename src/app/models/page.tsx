// app/models/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ModelsPage.css";
import Footer from "@/components/Footer";

export default function ModelsPage() {
  const { setSelectedModel, setIsModified } = useModel();
  const router = useRouter();

  // Only truly public models that require no license click
  const models = [
    {
      id:   "Mistral-7B",
      name: "Mistral 7B",
      repo: "mistralai/mistral-7b",
      description: "Open-source Mistral model with no gating.",
    },
    {
      id:   "Falcon-40B",
      name: "Falcon 40B",
      repo: "tiiuae/falcon-40b",
      description: "Versatile Falcon model, fully public.",
    },
    {
      id:   "GPT-J-6B",
      name: "GPT-J 6B",
      repo: "EleutherAI/gpt-j-6B",
      description: "Classic GPT-J 6B, no license needed.",
    },
    {
      id:   "GPT-Neo-2.7B",
      name: "GPT-Neo 2.7B",
      repo: "EleutherAI/gpt-neo-2.7B",
      description: "Public GPT-Neo 2.7B model.",
    },
    {
      id:   "FLAN-T5-Large",
      name: "FLAN-T5 Large",
      repo: "google/flan-t5-large",
      description: "Instruction-tuned T5, open to everyone.",
    },
  ];

  const handleSelect = (repo: string) => {
    setSelectedModel(repo);
    setIsModified(false);
    router.push("/modify");
  };

  return (
    <div className="models-page container">
      <h2>Select an AI Model to Modify</h2>
      <ul className="models-list">
        {models.map((m) => (
          <li key={m.id} onClick={() => handleSelect(m.repo)}>
            <h3>{m.name}</h3>
            <p>{m.description}</p>
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
}
