// src/app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import { ModelProvider } from "@/context/ModelContext";
import ClientNavBar from "@/app/ClientNavBar";
import "@/app/globals.css";

// --- Brand & URLs -------------------------------------------------
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "NSPIRE — LLM Customization · AI Development · AI Deployment";
const DESC =
  "Nspire™ is an AI-driven platform that creates domain-specific large language models with minimal user input. By leveraging Synra Labs, we compose custom neural architectures tailored for specific industries.";

// --- SEO / Social metadata ---------------------------------------
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · NSPIRE",
  },
  description: DESC,
  keywords: [
    "NSPIRE",
    "Synra Labs",
    "LLM",
    "fine-tuning",
    "LoRA",
    "AI development",
    "AI deployment",
    "model customization",
    "inference",
  ],
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: TITLE,
    description: DESC,
    siteName: "NSPIRE",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/opengraph-image.png", // optional: add this asset
        width: 1200,
        height: 630,
        alt: "NSPIRE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/opengraph-image.png"], // optional
  },
};

// (optional) browser UI theming
export const viewport: Viewport = {
  themeColor: "#ffd400", // yellow
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ModelProvider>
          <ClientNavBar />
          <main>{children}</main>

          {/* Structured data (helps with rich results) */}
          <script
            id="structured-data"
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "NSPIRE",
                url: SITE_URL,
                slogan: "LLM Customization · AI Development · AI Deployment",
                description: DESC,
              }),
            }}
          />
        </ModelProvider>
      </body>
    </html>
  );
}
