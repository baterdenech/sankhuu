import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { formatMNT } from "@/lib/labels";

export default async function StorefrontPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }) {
  const { slug } = await params;
  const { c } = await searchParams;
  const shop = await prisma.shop.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!shop) notFound();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shop.id, isActive: true, ...(c ? { category: c } : {}) },
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    }),
    prisma.product.groupBy({ by: ["category"], where: { shopId: shop.id, isActive: true, category: { not: null } }, _count: true }),
  ]);

  return (
    <>
      {categories.length > 1 && (
        <nav className="sf-chips" aria-label="Ангилал">
          <Link href={`/s/${slug}`} className={`chip${!c ? " on" : ""}`}>
            Бүгд
          </Link>
          {categories.map((g) => (
            <Link key={g.category} href={`/s/${slug}?c=${encodeURIComponent(g.category!)}`} className={`chip${c === g.category ? " on" : ""}`}>
              {g.category}
            </Link>
          ))}
        </nav>
      )}
      {products.length === 0 ? (
        <div className="empty">Одоогоор бараа байхгүй байна.</div>
      ) : (
        <ul className="sf-grid">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/s/${slug}/p/${p.id}`} className={`sf-product${p.stock === 0 ? " sold-out" : ""}`}>
                <div className="sf-media">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} loading="lazy" />
                  ) : (
                    <span className="no-image">Зураггүй</span>
                  )}
                  {p.stock === 0 && <span className="badge out">Дууссан</span>}
                </div>
                <div className="sf-product-name">{p.name}</div>
                <div className="sf-product-price">{formatMNT(p.price)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
