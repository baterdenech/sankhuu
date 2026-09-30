import { shopCard } from "@/lib/og-cards";

export const dynamic = "force-dynamic";

// Тохиргооны хуудасны урьдчилсан харагдац (og:image-ийн файлын дүрмийн URL нь hash-тай тул тогтмол зам хэрэгтэй)
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await shopCard(slug);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
