import { ImageResponse } from "next/og";
import { prisma } from "@sankhuu/db";
import { absoluteImage, BRAND, clip, OG_SIZE, ogFonts } from "@/lib/og";

// Дэлгүүрийн хуваалцах карт: opengraph-image.tsx (og:image) ба /api/og/shop/[slug] (тохиргооны урьдчилсан харагдац) хоёулаа үүнийг дуудна
export async function shopCard(slug: string) {
  const [shop, fonts] = await Promise.all([
    prisma.shop.findFirst({
      where: { slug, isActive: true },
      select: { name: true, logoUrl: true, _count: { select: { products: { where: { isActive: true } } } }, products: { where: { isActive: true, stock: { gt: 0 } }, orderBy: { ratingCount: "desc" }, take: 3, select: { images: true } } },
    }),
    ogFonts(),
  ]);
  const font = fonts.length ? "Inter" : "sans-serif";
  const logo = absoluteImage(shop?.logoUrl);
  const thumbs = (shop?.products ?? []).map((p) => absoluteImage(p.images[0])).filter((x): x is string => Boolean(x));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #ff7a1a, #ff4d2e)", fontFamily: font, color: "#fff", padding: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={120} height={120} style={{ width: 120, height: 120, borderRadius: 60, objectFit: "cover", border: "4px solid rgba(255,255,255,0.7)" }} />
          ) : (
            <div style={{ display: "flex", width: 120, height: 120, borderRadius: 60, background: "#fff", color: BRAND, fontSize: 64, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>{shop?.name.slice(0, 1) ?? "S"}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{shop ? clip(shop.name, 34) : "Дэлгүүр олдсонгүй"}</div>
            <div style={{ fontSize: 26, opacity: 0.9 }}>{shop ? `${shop._count.products} бараа · Sankhuu дээр` : "Sankhuu"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: "auto" }}>
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" width={330} height={300} style={{ width: 330, height: 300, objectFit: "cover", borderRadius: 24, border: "4px solid rgba(255,255,255,0.6)" }} />
          ))}
          {thumbs.length === 0 && <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>Хаалган дээр хүргэнэ · Хүлээж аваад төлнө</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
