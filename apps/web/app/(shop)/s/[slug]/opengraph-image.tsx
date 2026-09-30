import { OG_SIZE } from "@/lib/og";
import { shopCard } from "@/lib/og-cards";

export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Sankhuu дэлгүүр";

// Дэлгүүрийн холбоос хуваалцахад харагдах зураг (lib/og-cards.tsx)
export default async function ShopOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return shopCard(slug);
}
