import type { Metadata } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CityPulse AI — The City That Fixes Itself",
  description:
    "Urban Digital Immune System for municipalities. Citizens report, AI analyzes, workers fix.",
  keywords: ["smart city", "civic tech", "urban issues", "AI", "municipal", "Ahmedabad", "AMC"],
  authors: [{ name: "CityPulse AI" }],
  openGraph: {
    title: "CityPulse AI — The City That Fixes Itself",
    description: "Urban Digital Immune System for Ahmedabad",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
