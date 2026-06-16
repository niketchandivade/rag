import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "RAG Chat - AI-Powered Document Assistant",
  description: "Upload documents and chat with them using AI-powered search. Get accurate answers with source citations.",
  keywords: ["RAG", "AI", "Chat", "Documents", "Knowledge Base"],
  authors: [{ name: "RAG Team" }],
  openGraph: {
    title: "RAG Chat - AI-Powered Document Assistant",
    description: "Upload documents and chat with them using AI-powered search",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}