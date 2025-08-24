// src/app/models/page.tsx
// @ts-nocheck
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ModelsPage.css";
import Footer from "@/components/Footer";

type ModelItem = {
  id: string;
  name: string;
  repo: string;        // HF repo id we send to the backend
  description: string; // short blurb
  gated?: boolean;     // needs HF access approval
};

export default function ModelsPage() {
  const { setSelectedModel, setIsModified } = useModel();
  const router = useRouter();

  // curated list; all repos are correct HF IDs
  const models: ModelItem[] = [
    // lightweight / great for testing
    {
      id: "TinyLlama11BChat",
      name: "TinyLlama-1.1B-Chat",
      repo: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
      description: "Very small & fast. Ideal for first-run smoke tests.",
    },

    // strong small models
    {
      id: "Phi3Mini4kInstruct",
      name: "Phi-3-mini-4k-instruct",
      repo: "microsoft/Phi-3-mini-4k-instruct",
      description: "Small, instruction-tuned; good accuracy / cost balance.",
    },
    {
      id: "Qwen2_1_5B_Instruct",
      name: "Qwen2-1.5B-Instruct",
      repo: "Qwen/Qwen2-1.5B-Instruct",
      description: "Tiny but capable multilingual model.",
    },
    {
      id: "Gemma2_2B_it",
      name: "Gemma-2-2B-it",
      repo: "google/gemma-2-2b-it",
      description: "Google’s compact instruct model.",
    },

    // 7B class
    {
      id: "Mistral7BInstruct03",
      name: "Mistral-7B-Instruct-v0.3",
      repo: "mistralai/Mistral-7B-Instruct-v0.3",
      description: "Strong 7B instruct model (public).",
    },
    {
      id: "CodeLlama7BInstruct",
      name: "CodeLlama-7B-Instruct",
      repo: "codellama/CodeLlama-7b-Instruct-hf",
      description: "Coding-focused instruction model.",
    },
    {
      id: "DeepSeekLLM7BChat",
      name: "DeepSeek-LLM-7B-Chat",
      repo: "deepseek-ai/deepseek-llm-7b-chat",
      description: "General chat model from DeepSeek.",
    },
    {
      id: "DeepSeekCoder1_3BInstr",
      name: "DeepSeek-Coder-1.3B-Instruct",
      repo: "deepseek-ai/deepseek-coder-1.3b-instruct",
      description: "Small code-tuned model for programming tasks.",
    },

    // legacy / classics
    {
      id: "Falcon7B",
      name: "Falcon-7B",
      repo: "tiiuae/falcon-7b",
      description: "Classic 7B base model (not instruct).",
    },
    {
      id: "GPTJ6B",
      name: "GPT-J-6B",
      repo: "EleutherAI/gpt-j-6B",
      description: "Older open model (baseline).",
    },
    {
      id: "DistilGPT2",
      name: "DistilGPT-2",
      repo: "distilgpt2",
      description: "Tiny GPT-2 distilled; extremely fast baseline.",
    },

    // gated examples (need HF approval on your token)
    {
      id: "Llama3_8B_Instruct",
      name: "LLaMA-3-8B-Instruct (gated)",
      repo: "meta-llama/Meta-Llama-3-8B-Instruct",
      description: "Requires HF access grant on your token.",
      gated: true,
    },
  ];

  const handleSelect = (repo: string) => {
    setSelectedModel(repo);      // this is what /modify + /chat will use
    setIsModified(false);
    router.push("/modify");      // go straight to modify page
  };

  return (
    <div className="models-page container">
      <h2>Select Base Model</h2>
      <ul className="models-list">
        {models.map((m) => (
          <li key={m.id} onClick={() => handleSelect(m.repo)}>
            <h3>
              {m.name}{" "}
              {m.gated && (
                <span title="Requires gated access on your Hugging Face account">ⓘ</span>
              )}
            </h3>
            <p>{m.description}</p>
            <small style={{ opacity: 0.7 }}>{m.repo}</small>
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
}
