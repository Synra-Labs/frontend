// src/app/page.tsx
// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import "@/app/styles/HomePage.css";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="home-page container">
      <section className="hero-section">
        <motion.h1
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 1 }}
          className="hero-title"
        >
          Ailo Forge™
        </motion.h1>

        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 1, delay: 0.3 }}
          className="hero-subtitle"
        >
          LLM Customization · AI Development · AI Deployment
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 1, delay: 0.6 }}
          className="hero-description"
        >
          Ailo Forge™ is an AI-driven platform that creates domain-specific large language models (LLMs)
          with minimal user input. By leveraging “AI logic”, we compose custom neural architectures tailored
          for industries like finance, biotech, manufacturing, and more.
        </motion.p>

        <motion.button
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 1, delay: 0.9 }}
          className="mil-button hero-btn"
          onClick={() => router.push("/models")}
        >
          Select Model
        </motion.button>
      </section>
    </div>
  );
}
