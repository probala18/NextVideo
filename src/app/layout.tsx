import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CreatorLens — YouTube Creator Intelligence & Production Studio",
  description:
    "CreatorLens helps YouTube creators discover their niche, study competitor channels, validate ideas, and build production packs with clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-ink-950 text-ink-100 antialiased min-h-screen selection:bg-studio-orange selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
