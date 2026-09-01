import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AI English Evaluator",
  description: "Evaluasi Writing dan Speaking bahasa Inggris menggunakan LLM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-ink-soft">
          AI English Evaluator - Project (LLM + Speech-to-Text)
        </footer>
      </body>
    </html>
  );
}