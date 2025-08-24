"use client";
import React, { useState } from "react";
import axios from "axios";
import { useModel } from "@/context/ModelContext";
import "@/app/styles/ChatPage.css";
import Footer from "@/components/Footer";

export default function ChatPage() {
  const { selectedModel } = useModel();
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; message: string }[]>([]);

  const handleSend = async () => {
    if (!prompt.trim() || !selectedModel) return;

    // append user to history
    setChatHistory(h => [...h, { role: "user", message: prompt }]);

    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");
    try {
      const { data } = await axios.post(
        `${backendUrl}/run`,
        { modelId: selectedModel, prompt },
        { headers: { "Content-Type": "application/json" } }
      );

      // backend returns { success, response }
      setChatHistory(h => [...h, { role: "bot", message: data.response }]);
    } catch (err: any) {
      console.error("Chat error:", err.response || err.message);
      alert("Error communicating with model: " + (err.response?.data?.detail || err.message));
    }

    setPrompt("");
  };

  return (
    <div className="chat-page container">
      <h2>Chat with {selectedModel || "your model"}</h2>
      <div className="chat-history">
        {chatHistory.map((m,i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.message}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type your message…"
        />
        <button onClick={handleSend} className="btn chat-send-btn">Send</button>
      </div>
      <Footer />
    </div>
  );
}
