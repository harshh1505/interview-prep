import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rehearsal — AI interview practice",
  description: "Realistic mock interviews with AI-generated questions and personalized feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
