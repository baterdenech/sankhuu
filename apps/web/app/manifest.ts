import type { MetadataRoute } from "next";

// Худалдан авагчийн апп-ын PWA манифест (жолоочийнх /driver/manifest.webmanifest)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sankhuu · Онлайн худалдаа, хүргэлт",
    short_name: "Sankhuu",
    description: "Дэлгүүрүүдийн барааг нэг дороос захиалаад хаалган дээрээ хүргүүлнэ.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f3ef",
    theme_color: "#ff6f0f",
    lang: "mn",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Хайх", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Миний захиалга", url: "/me", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Сагс", url: "/cart", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
