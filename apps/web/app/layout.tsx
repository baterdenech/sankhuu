import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/og";
import { PwaRegister } from "./_components/pwa";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Sankhuu",
  description: "Онлайн худалдаа, хүргэлтийн систем",
  openGraph: { siteName: "Sankhuu", locale: "mn_MN", type: "website" },
  applicationName: "Sankhuu",
  appleWebApp: { capable: true, title: "Sankhuu", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff6f0f" },
    { media: "(prefers-color-scheme: dark)", color: "#171513" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        {/* Inter: кирилл үсэгтэй, орчин үеийн фонт. Ачаалагдахгүй бол системийн фонт руу унана. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
