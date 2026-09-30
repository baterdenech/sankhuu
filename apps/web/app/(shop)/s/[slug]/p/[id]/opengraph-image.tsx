import { ImageResponse } from "next/og";
import { prisma } from "@sankhuu/db";
import { absoluteImage, BRAND, BRAND_DARK, clip, mnt, OG_SIZE, ogFonts } from "@/lib/og";
import { discountPct } from "../../../../_components/product-card";

export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Sankhuu бараа";

// Барааны холбоос хуваалцахад харагдах зураг: зураг · нэр · үнэ · дэлгүүр · хүргэлтийн амлалт
export default async function ProductOgImage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const [p, fonts] = await Promise.all([
    prisma.product.findFirst({ where: { id, isActive: true, shop: { slug, isActive: true } }, include: { shop: { select: { name: true } } } }),
    ogFonts(),
  ]);
  const image = absoluteImage(p?.images[0]);
  const pct = p ? discountPct(p.price, p.compareAtPrice) : 0;
  const font = fonts.length ? "Inter" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f3ef", fontFamily: font, color: "#1b1b1b" }}>
        <div style={{ width: 630, height: 630, display: "flex", background: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" width={630} height={630} style={{ objectFit: "cover", width: 630, height: 630 }} />
          ) : (
            <div style={{ display: "flex", width: 630, height: 630, background: "linear-gradient(135deg, #ff7a1a, #ff4d2e)", color: "#fff", fontSize: 200, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>S</div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 48px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, #ff7a1a, #ff4d2e)`, color: "#fff", fontSize: 26, fontWeight: 700, alignItems: "center", justifyContent: "center" }}>S</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: BRAND }}>Sankhuu</div>
            <div style={{ marginLeft: "auto", fontSize: 22, color: "#8a8a8a" }}>{p ? clip(p.shop.name, 24) : ""}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: p && p.name.length > 40 ? 40 : 48, fontWeight: 700, lineHeight: 1.2 }}>{p ? clip(p.name, 70) : "Бараа олдсонгүй"}</div>
            {p && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                {pct > 0 && <div style={{ fontSize: 34, fontWeight: 700, color: "#f0303f" }}>{`-${pct}%`}</div>}
                <div style={{ fontSize: 60, fontWeight: 700, color: BRAND_DARK, letterSpacing: -1 }}>{mnt(p.price)}</div>
                {pct > 0 && <div style={{ fontSize: 26, color: "#8a8a8a", textDecoration: "line-through" }}>{mnt(p.compareAtPrice!)}</div>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "#fff1e6", color: BRAND_DARK, fontSize: 22, fontWeight: 700 }}>Маргааш хүргэнэ</div>
            <div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "#fff", color: "#555", fontSize: 22, fontWeight: 400 }}>Хүлээж аваад төлнө</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
