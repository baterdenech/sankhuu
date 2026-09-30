import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../../../_components/top-bar";
import { StoreIcon, TruckIcon } from "../../../../_components/icons";
import { Price, ProductCard, ProductImage } from "../../../../_components/product-card";
import { soldCounts } from "../../../../_components/catalog";
import { BuyBar } from "./buy-bar";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.product.findFirst({ where: { id, isActive: true }, select: { name: true, description: true, images: true } });
  return p ? { title: `${p.name} · Sankhuu`, description: p.description ?? undefined, openGraph: { images: p.images[0] ? [p.images[0]] : [] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const product = await prisma.product.findFirst({ where: { id, isActive: true, shop: { slug, isActive: true } }, include: { shop: true } });
  if (!product) notFound();

  const [sold, more] = await Promise.all([
    soldCounts([product.id]),
    prisma.product.findMany({ where: { shopId: product.shopId, isActive: true, id: { not: product.id }, stock: { gt: 0 } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <>
      <TopBar title="" backHref={`/s/${slug}`} />
      <article className="pdp">
        <div className="pdp-media">
          <ProductImage src={product.images[0]} alt={product.name} category={product.category} />
        </div>
        <div className="pdp-body">
          <div className="pdp-price-row">
            <Price value={product.price} className="pdp-price" />
            <span className="chip mini">Хүргэлт 5,000₮-с</span>
          </div>
          <h1 className="pdp-name">{product.name}</h1>
          <div className="pdp-meta muted small-text">
            {product.category && <span>{product.category}</span>}
            {sold.get(product.id) ? <span>{sold.get(product.id)} зарагдсан</span> : null}
            <span>{product.stock > 0 ? (product.stock <= 3 ? `${product.stock} ш үлдсэн` : "Бэлэн байгаа") : "Дууссан"}</span>
          </div>
          <ul className="pdp-perks">
            <li>
              <TruckIcon size={18} /> Хүргэлт Улаанбаатар хотод 5,000₮-с, төлбөрийг хүлээж аваад төлнө
            </li>
          </ul>
        </div>

        <Link href={`/s/${slug}`} className="pdp-shop">
          {product.shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.shop.logoUrl} alt="" className="shop-logo sm" />
          ) : (
            <span className="shop-logo sm letter">{product.shop.name.slice(0, 1)}</span>
          )}
          <span className="pdp-shop-name">
            <strong>{product.shop.name}</strong>
            <span className="muted small-text">Дэлгүүр үзэх</span>
          </span>
          <StoreIcon />
        </Link>

        {product.description && (
          <section className="pdp-section">
            <h2>Тайлбар</h2>
            <p className="pdp-desc">{product.description}</p>
          </section>
        )}

        {more.length > 0 && (
          <section className="pdp-section">
            <h2>Энэ дэлгүүрийн бусад бараа</h2>
            <div className="hscroll">
              {more.map((p) => (
                <div key={p.id} className="hscroll-item">
                  <ProductCard p={{ ...p, shop: { slug, name: product.shop.name } }} showShop={false} />
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
      <BuyBar
        item={{ productId: product.id, name: product.name, price: product.price, image: product.images[0] ?? null, category: product.category, maxQty: product.stock, shopId: product.shopId, shopSlug: slug, shopName: product.shop.name }}
        shopHref={`/s/${slug}`}
      />
    </>
  );
}
