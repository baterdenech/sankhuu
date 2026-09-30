import { ImageResponse } from "next/og";
import { BRAND, OG_SIZE, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Sankhuu · Онлайн худалдаа, хүргэлт";

// Нүүр болон бусад хуудсын анхдагч хуваалцах зураг
export default async function HomeOgImage() {
  const fonts = await ogFonts();
  const font = fonts.length ? "Inter" : "sans-serif";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20, background: "linear-gradient(160deg, #ff7a1a, #ff4d2e)", fontFamily: font, color: "#fff" }}>
        <div style={{ display: "flex", width: 140, height: 140, borderRadius: 40, background: "#fff", color: BRAND, fontSize: 88, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>S</div>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>Sankhuu</div>
        <div style={{ fontSize: 34, opacity: 0.92 }}>Дэлгүүрүүдийн барааг нэг дороос · Хаалган дээр хүргэнэ</div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
