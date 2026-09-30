// Жолоочийн апп-ын PWA манифест: нүүр дэлгэцэнд нэмэхэд /driver-ээс нээгдэнэ
export function GET() {
  const manifest = {
    name: "Sankhuu Жолооч",
    short_name: "Sankhuu Жолооч",
    description: "Хүргэлтийн даалгавар, байршил, бэлэн мөнгө",
    start_url: "/driver?source=pwa",
    scope: "/driver",
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
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
