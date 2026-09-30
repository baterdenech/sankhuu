import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../../../_components/top-bar";
import { CartIcon, TruckIcon } from "../../../../_components/icons";
import { CartBadge } from "../../../../_components/cart-badge";
import { PriceBlock, ProductCard, ProductImage } from "../../../../_components/product-card";
import { DELIVERY_FROM, DELIVERY_PROMISE, soldCounts } from "../../../../_components/catalog";
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
  const soldN = sold.get(product.id) ?? 0;

  return (
    <>
      <TopBar
        title=""
        backHref={`/s/${slug}`}
        right={
          <Link href="/cart" className="topbar-cart" aria-label="Сагс">
            <CartIcon />
            <CartBadge />
          </Link>
        }
      />
      <article className="pdp">
        <div className="pdp-media">
          <ProductImage src={product.images[0]} alt={product.name} category={product.category} />
          <span className="pdp-counter">1 / {Math.max(1, product.images.length)}</span>
        </div>

        <div className="pdp-body">
          <Link href={`/s/${slug}`} className="pdp-seller">
            {product.shop.name} ›
          </Link>
          <h1 className="pdp-name">{product.name}</h1>
          <div className="pdp-stats muted small-text">
            {soldN > 0 && <span>{soldN} зарагдсан</span>}
            {product.category && <span>{product.category}</span>}
            <span className={product.stock === 0 ? "out" : product.stock <= 3 ? "low" : ""}>
              {product.stock > 0 ? (product.stock <= 3 ? `${product.stock} ш үлдсэн` : "Бэлэн байгаа") : "Дууссан"}
            </span>
          </div>
          <PriceBlock price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
        </div>

        <div className="pdp-delivery">
          <div className="pdp-delivery-row">
            <TruckIcon size={20} />
            <div>
              <strong className="arrive">{DELIVERY_PROMISE}</strong>
              <span className="muted small-text"> · {DELIVERY_FROM}, Улаанбаатар хотод</span>
            </div>
          </div>
          <div className="pdp-delivery-row">
            <span className="pay-mark">₮</span>
            <div>
              <strong>Хүлээж аваад төлнө</strong>
              <span className="muted small-text"> · бэлнээр эсвэл шилжүүлгээр</span>
            </div>
          </div>
        </div>

        {product.description && (
          <section className="pdp-section">
            <h2>Барааны мэдээлэл</h2>
            <p className="pdp-desc">{product.description}</p>
          </section>
        )}

        {more.length > 0 && (
          <section className="pdp-section">
            <h2>{product.shop.name} дэлгүүрийн бусад бараа</h2>
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
      />
    </>
  );
}
