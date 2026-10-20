import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCM CUTFLOW — Cyber-Forge Workstation",
  description: "10-faction AI video forge. Pro Unlimited Zone + Credit Forge. Burmese-native, mobile-first.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#06080f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="my">
      <body className="min-h-[100dvh] overflow-x-clip">
        <div className="pointer-events-none fixed inset-0 z-[1] dotgrid-faint opacity-60" aria-hidden />
        {children}
      </body>
    </html>
  );
}
