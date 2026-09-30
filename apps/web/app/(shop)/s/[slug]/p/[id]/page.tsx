import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../../../_components/top-bar";
import { CartIcon, ChevronIcon, TruckIcon } from "../../../../_components/icons";
import { CartBadge } from "../../../../_components/cart-badge";
import { PriceBlock, ProductCard, RocketBadge, Stars } from "../../../../_components/product-card";
import { DELIVERY_FROM, DELIVERY_PROMISE, arrivalLabel, soldCounts } from "../../../../_components/catalog";
import { BuyBar } from "./buy-bar";
import { Gallery } from "./gallery";
import { PdpTabs } from "./pdp-tabs";
import { ShareButton } from "../../../../_components/share-button";
import { AskBar } from "../../../../_components/ask-bar";
import { HeartButton } from "../../../../_components/favorites";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.product.findFirst({ where: { id, isActive: true }, select: { name: true, description: true, price: true, shop: { select: { name: true } } } });
  if (!p) return {};
  const description = `${p.price.toLocaleString("en-US")}₮ · ${p.shop.name}. ${p.description ?? "Sankhuu-гээр захиалаад хаалган дээрээ хүргүүлнэ."}`.slice(0, 200);
  // og:image-ийг opengraph-image.tsx (файлын дүрэм) үүсгэнэ
  return { title: `${p.name} · Sankhuu`, description, openGraph: { title: p.name, description, type: "website" } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const product = await prisma.product.findFirst({ where: { id, isActive: true, shop: { slug, isActive: true } }, include: { shop: { include: { pickupAddress: true } } } });
  if (!product) notFound();

  const [sold, more, reviews, shopProductCount] = await Promise.all([
    soldCounts([product.id]),
    prisma.product.findMany({ where: { shopId: product.shopId, isActive: true, id: { not: product.id }, stock: { gt: 0 } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.review.findMany({ where: { productId: product.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.product.count({ where: { shopId: product.shopId, isActive: true } }),
  ]);
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));
  const soldN = sold.get(product.id) ?? 0;
  const photoReviews = reviews.filter((r) => r.images.length > 0);
  const tabs = [
    { id: "info", label: "Мэдээлэл" },
    { id: "reviews", label: product.ratingCount > 0 ? `Үнэлгээ ${product.ratingCount}` : "Үнэлгээ" },
    { id: "shop", label: "Дэлгүүр" },
  ];

  return (
    <>
      <TopBar
        title=""
        backHref={`/s/${slug}`}
        right={
          <>
            <HeartButton productId={product.id} size={22} className="topbar-heart" />
            <ShareButton title={product.name} text={`${product.name} · ${product.price.toLocaleString("en-US")}₮`} />
            <Link href="/cart" className="topbar-cart" aria-label="Сагс">
              <CartIcon />
              <CartBadge />
            </Link>
          </>
        }
      />
      <article className="pdp">
        <Gallery images={product.images} alt={product.name} category={product.category} />

        <div className="pdp-body">
          <Link href={`/s/${slug}`} className="pdp-seller">
            {product.shop.name} <ChevronIcon size={14} />
          </Link>
          <h1 className="pdp-name">{product.name}</h1>
          {product.ratingCount > 0 && (
            <a href="#reviews" className="pdp-rating">
              <Stars count={product.ratingCount} sum={product.ratingSum} size="lg" /> <span className="muted small-text">сэтгэгдэл {product.ratingCount} ›</span>
            </a>
          )}
          <PriceBlock price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
          <div className="pdp-stats muted small-text">
            {soldN > 0 && <span>{soldN} зарагдсан</span>}
            {product.category && <span>{product.category}</span>}
            <span className={product.stock === 0 ? "out" : product.stock <= 3 ? "low" : ""}>
              {product.stock > 0 ? (product.stock <= 3 ? `${product.stock} ш үлдсэн` : "Бэлэн байгаа") : "Дууссан"}
            </span>
          </div>
        </div>

        <div className="pdp-delivery">
          <div className="pdp-delivery-row">
            <TruckIcon size={20} />
            <div>
              <RocketBadge /> <strong className="arrive">{arrivalLabel()}</strong>
              <div className="muted small-text">
                {DELIVERY_PROMISE} · {DELIVERY_FROM}, Улаанбаатар хотод
              </div>
            </div>
          </div>
          <div className="pdp-delivery-row">
            <span className="pay-mark">₮</span>
            <div>
              <strong>Хүлээж аваад төлнө</strong>
              <div className="muted small-text">Бэлнээр эсвэл шилжүүлгээр, жолоочид</div>
            </div>
          </div>
          <AskBar compact title="Энэ барааны тухай асуух" prompt="Энэ бараа надад тохирох уу? Товч хэлээд, сэтгэгдлүүдийг нь дүгнээд өгөөч." />
        </div>

        <div className="pdp-buy">
          <BuyBar
            item={{ productId: product.id, name: product.name, price: product.price, image: product.images[0] ?? null, category: product.category, maxQty: product.stock, shopId: product.shopId, shopSlug: slug, shopName: product.shop.name }}
          />
        </div>

        <PdpTabs tabs={tabs} />

        <section className="pdp-section" id="info">
          <h2>Барааны мэдээлэл</h2>
          {product.description ? <p className="pdp-desc">{product.description}</p> : <p className="muted small-text">Дэлгүүр тайлбар оруулаагүй байна.</p>}
          <dl className="pdp-specs">
            {product.category && (
              <>
                <dt>Ангилал</dt>
                <dd>{product.category}</dd>
              </>
            )}
            <dt>Дэлгүүр</dt>
            <dd>{product.shop.name}</dd>
            {product.shop.pickupAddress && (
              <>
                <dt>Илгээх газар</dt>
                <dd>{product.shop.pickupAddress.district}</dd>
              </>
            )}
            <dt>Төлбөр</dt>
            <dd>Хүргэлтийн үед бэлнээр / шилжүүлгээр</dd>
          </dl>
        </section>

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
              {photoReviews.length > 0 && (
                <div className="review-strip" aria-label="Зурагтай сэтгэгдэл">
                  {photoReviews.flatMap((r) => r.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" loading="lazy" />
                  )))}
                </div>
              )}
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

        <section className="pdp-section" id="shop">
          <div className="shop-card">
            {product.shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.shop.logoUrl} alt="" className="shop-logo sm" />
            ) : (
              <span className="shop-logo sm letter">{product.shop.name.slice(0, 1)}</span>
            )}
            <div className="shop-card-body">
              <strong>{product.shop.name}</strong>
              <span className="muted small-text">
                {shopProductCount} бараа{product.shop.pickupAddress ? ` · ${product.shop.pickupAddress.district}` : ""}
              </span>
            </div>
            <Link href={`/s/${slug}`} className="btn small outline">
              Дэлгүүр үзэх
            </Link>
          </div>
          {more.length > 0 && (
            <>
              <h2 className="shop-more-title">Энэ дэлгүүрийн бусад бараа</h2>
              <div className="hscroll">
                {more.map((p) => (
                  <div key={p.id} className="hscroll-item">
                    <ProductCard p={{ ...p, shop: { slug, name: product.shop.name } }} showShop={false} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </article>
    </>
  );
}

// "Болормаа" → "Б***"
function maskName(name: string) {
  return name ? name.slice(0, 1) + "***" : "Худалдан авагч";
}
