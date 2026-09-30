import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../../../_components/top-bar";
import { CartIcon, TruckIcon } from "../../../../_components/icons";
import { CartBadge } from "../../../../_components/cart-badge";
import { PriceBlock, ProductCard, ProductImage, Stars } from "../../../../_components/product-card";
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

  const [sold, more, reviews] = await Promise.all([
    soldCounts([product.id]),
    prisma.product.findMany({ where: { shopId: product.shopId, isActive: true, id: { not: product.id }, stock: { gt: 0 } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.review.findMany({ where: { productId: product.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));
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
          {product.ratingCount > 0 && (
            <a href="#reviews" className="pdp-rating">
              <Stars count={product.ratingCount} sum={product.ratingSum} size="lg" /> <span className="muted small-text">сэтгэгдэл үзэх ›</span>
            </a>
          )}
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

        <section className="pdp-section" id="reviews">
          <h2>Үнэлгээ, сэтгэгдэл {product.ratingCount > 0 && <span className="muted">({product.ratingCount})</span>}</h2>
          {product.ratingCount === 0 ? (
            <p className="muted small-text">Одоогоор үнэлгээ алга. Худалдан авсны дараа та эхнийх нь болоорой.</p>
          ) : (
            <>
              <div className="rating-summary">
                <div className="rating-avg">
                  <strong>{(product.ratingSum / product.ratingCount).toFixed(1)}</strong>
                  <Stars count={product.ratingCount} sum={product.ratingSum} size="lg" />
                </div>
                <ul className="rating-dist">
                  {dist.map((d) => (
                    <li key={d.star}>
                      <span>{d.star}★</span>
                      <span className="bar">
                        <span style={{ width: `${reviews.length ? (d.n / reviews.length) * 100 : 0}%` }} />
                      </span>
                      <span className="muted">{d.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="reviews">
                {reviews.map((r) => (
                  <li key={r.id} className="review">
                    <div className="review-head">
                      <Stars count={1} sum={r.rating} />
                      <span className="muted small-text">
                        {maskName(r.customerName)} · {r.createdAt.toLocaleDateString("mn-MN")}
                      </span>
                    </div>
                    {r.comment && <p className="review-text">{r.comment}</p>}
                    {r.images.length > 0 && (
                      <div className="review-images">
                        {r.images.map((src) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={src} src={src} alt="" loading="lazy" />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

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

// "Болормаа" → "Б***"
function maskName(name: string) {
  return name ? name.slice(0, 1) + "***" : "Худалдан авагч";
}
