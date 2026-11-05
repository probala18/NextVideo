import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextVideo — YouTube Creator Intelligence & Production Studio",
  description:
    "NextVideo helps YouTube creators discover their niche, study competitor channels, validate ideas, and build production packs with clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-ink-950 text-ink-100 antialiased min-h-screen selection:bg-studio-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
