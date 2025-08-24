// src/app/components/Footer.tsx
"use client";
import React from "react";
import Link from "next/link";
import "@/app/styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-nav">
        <Link href="/" legacyBehavior><a>Ailo Forge</a></Link>
        <span>|</span>
        <Link href="/models" legacyBehavior><a>Models</a></Link>
        <span>|</span>
        <Link href="/modify" legacyBehavior><a>Modify</a></Link>
        <span>|</span>
        <Link href="/chat" legacyBehavior><a>Chat</a></Link>
        <span>|</span>
        <Link href="/train" legacyBehavior><a>Train</a></Link>
        <span>|</span>
        <a
          href="https://x.com/ailolabs?s=21&t=xn49oB2Do1SwQ6xXrDHWAw"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ailo Labs on X
        </a>
        <span>|</span>
        <a href="https://forgedocs.ailolabs.com/" target="_blank" rel="noopener noreferrer">
          Ailo Forge Docs
        </a>
      </div>
      <div className="footer-description">
        <p>
          <strong>Models:</strong> Select and view available AI models.&nbsp;&nbsp;
          <strong>Modify:</strong> Customize model parameters.&nbsp;&nbsp;
          <strong>Chat:</strong> Interact with your custom model.&nbsp;&nbsp;
          <strong>Train:</strong> Fine-tune your model with your own dataset.
        </p>
        <p>
          For more details, visit {" "}
          <a
            href="http://Ailolabs.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ailo Labs
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
