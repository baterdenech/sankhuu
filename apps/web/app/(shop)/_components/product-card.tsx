import Link from "next/link";
import { categoryStyle } from "./catalog-meta";
import { DELIVERY_PROMISE } from "./catalog-meta";

export type CardProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  stock: number;
  category?: string | null;
  ratingCount?: number;
  ratingSum?: number;
  createdAt?: Date;
  shop: { slug: string; name: string };
  sold?: number;
};

export function discountPct(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function Price({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`price ${className}`}>
      {value.toLocaleString("en-US")}
      <span className="price-cur">₮</span>
    </span>
  );
}

// Coupang маягийн үнийн блок: хямдралын хувь (улаан) · зурсан хуучин үнэ · бодит үнэ (хар, том)
export function PriceBlock({ price, compareAtPrice, size = "sm" }: { price: number; compareAtPrice?: number | null; size?: "sm" | "lg" }) {
  const pct = discountPct(price, compareAtPrice);
  return (
    <div className={`priceblock ${size}`}>
      {pct > 0 && (
        <div className="priceblock-top">
          <span className="discount">{pct}%</span>
          <s className="was">{compareAtPrice!.toLocaleString("en-US")}₮</s>
        </div>
      )}
      <Price value={price} />
    </div>
  );
}

export function Stars({ count, sum, size = "sm" }: { count?: number; sum?: number; size?: "sm" | "lg" }) {
  if (!count) return null;
  const avg = sum! / count;
  return (
    <span className={`stars ${size}`} aria-label={`${avg.toFixed(1)} од, ${count} үнэлгээ`}>
      <span className="stars-bg" aria-hidden>
        ★★★★★<span className="stars-fg" style={{ width: `${(avg / 5) * 100}%` }}>★★★★★</span>
      </span>
      <span className="stars-num">{avg.toFixed(1)}</span>
      <span className="stars-count">({count})</span>
    </span>
  );
}

export function ProductImage({ src, alt, category, className = "" }: { src?: string; alt: string; category?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={className} />;
  }
  const { background, icon } = categoryStyle(category);
  return (
    <span className={`img-placeholder ${className}`} style={{ background }} aria-label="Зураггүй">
      <span>{icon}</span>
    </span>
  );
}

const NEW_DAYS = 7;

export function ProductCard({ p, showShop = true }: { p: CardProduct; showShop?: boolean }) {
  const isNew = p.createdAt ? Date.now() - p.createdAt.getTime() < NEW_DAYS * 86400000 : false;
  return (
    <Link href={`/s/${p.shop.slug}/p/${p.id}`} className={`pcard${p.stock === 0 ? " sold-out" : ""}`}>
      <div className="pcard-media">
        <ProductImage src={p.images[0]} alt={p.name} category={p.category} />
        {p.stock === 0 && <span className="pcard-out">Дууссан</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{p.name}</div>
        <PriceBlock price={p.price} compareAtPrice={p.compareAtPrice} />
        <Stars count={p.ratingCount} sum={p.ratingSum} />
        <div className="pcard-delivery">
          <span className="rocket">Sankhuu хүргэлт</span>
          <span className="arrive">{DELIVERY_PROMISE}</span>
        </div>
        <div className="pcard-meta">
          {showShop && <span className="pcard-shop">{p.shop.name}</span>}
          {p.sold ? <span className="pcard-sold">{p.sold} зарагдсан</span> : isNew ? <span className="pcard-sold new">Шинэ</span> : null}
        </div>
      </div>
    </Link>
  );
}
