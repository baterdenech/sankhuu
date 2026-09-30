import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { formatPhone } from "@/lib/phone";
import { TopBar } from "../../_components/top-bar";
import { ProductCard } from "../../_components/product-card";
import { soldCounts } from "../../_components/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const shop = await prisma.shop.findFirst({ where: { slug: (await params).slug, isActive: true }, select: { name: true } });
  return { title: shop ? `${shop.name} · Sankhuu` : "Дэлгүүр олдсонгүй" };
}

export default async function ShopPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string }> }) {
  const { slug } = await params;
  const { c } = await searchParams;
  const shop = await prisma.shop.findFirst({ where: { slug, isActive: true }, include: { pickupAddress: true } });
  if (!shop) notFound();

  const [products, groups] = await Promise.all([
    prisma.product.findMany({ where: { shopId: shop.id, isActive: true, ...(c ? { category: c } : {}) }, orderBy: [{ stock: "desc" }, { createdAt: "desc" }] }),
    prisma.product.groupBy({ by: ["category"], where: { shopId: shop.id, isActive: true, category: { not: null } }, _count: true }),
  ]);
  const sold = await soldCounts(products.map((p) => p.id));
  const totalSold = [...sold.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <TopBar title={shop.name} backHref="/" />
      <section className="shop-head">
        {shop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" className="shop-logo" />
        ) : (
          <span className="shop-logo letter">{shop.name.slice(0, 1)}</span>
        )}
        <div className="shop-head-body">
          <strong>{shop.name}</strong>
          <span className="muted small-text">
            {products.length} бараа{totalSold ? ` · ${totalSold} зарагдсан` : ""}
            {shop.pickupAddress ? ` · ${shop.pickupAddress.district}` : ""}
          </span>
        </div>
        <a href={`tel:${shop.phone}`} className="btn small">
          {formatPhone(shop.phone)}
        </a>
      </section>

      {groups.length > 1 && (
        <nav className="chips scroll" aria-label="Ангилал">
          <a href={`/s/${slug}`} className={`chip${!c ? " on" : ""}`}>
            Бүгд
          </a>
          {groups.map((g) => (
            <a key={g.category} href={`/s/${slug}?c=${encodeURIComponent(g.category!)}`} className={`chip${c === g.category ? " on" : ""}`}>
              {g.category}
            </a>
          ))}
        </nav>
      )}

      {products.length === 0 ? (
        <div className="empty">Одоогоор бараа байхгүй байна.</div>
      ) : (
        <div className="pgrid pad">
          {products.map((p) => (
            <ProductCard key={p.id} p={{ ...p, shop: { slug, name: shop.name }, sold: sold.get(p.id) }} showShop={false} />
          ))}
        </div>
      )}
    </>
  );
}
