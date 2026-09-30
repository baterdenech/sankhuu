import Link from "next/link";
import { ProductImage } from "./product-image";
export { ProductImage };
import { RocketIcon } from "./icons";
import { arrivalLabel } from "./catalog-meta";

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

// Одтой үнэлгээ. Coupang картан дээр од + (тоо) л харуулдаг; дундаж тоог `showAvg`-аар нэмнэ (дэлгэрэнгүй хуудас).
export function Stars({ count, sum, size = "sm", showAvg = size === "lg" }: { count?: number; sum?: number; size?: "sm" | "lg"; showAvg?: boolean }) {
  if (!count) return null;
  const avg = sum! / count;
  return (
    <span className={`stars ${size}`} aria-label={`${avg.toFixed(1)} од, ${count} үнэлгээ`}>
      <span className="stars-bg" aria-hidden>
        ★★★★★<span className="stars-fg" style={{ width: `${(avg / 5) * 100}%` }}>★★★★★</span>
      </span>
      {showAvg && <span className="stars-num">{avg.toFixed(1)}</span>}
      <span className="stars-count">({count.toLocaleString("en-US")})</span>
    </span>
  );
}

// "Sankhuu хүргэлт" шошго (Coupang-ийн 로켓배송 логотой адил байрлалд)
export function RocketBadge() {
  return (
    <span className="rocket">
      <RocketIcon />
      Sankhuu хүргэлт
    </span>
  );
}

const NEW_DAYS = 7;

// Барааны карт, Coupang анатоми: зураг → нэр → хямдрал/үнэ → хүргэлт (пуужин + хүрэх өдөр) → од (тоо) → дэлгүүр
export function ProductCard({ p, showShop = true }: { p: CardProduct; showShop?: boolean }) {
  const isNew = p.createdAt ? Date.now() - p.createdAt.getTime() < NEW_DAYS * 86400000 : false;
  const pct = discountPct(p.price, p.compareAtPrice);
  return (
    <Link href={`/s/${p.shop.slug}/p/${p.id}`} className={`pcard${p.stock === 0 ? " sold-out" : ""}`}>
      <div className="pcard-media">
        <ProductImage src={p.images[0]} alt={p.name} category={p.category} />
        {p.stock === 0 ? <span className="pcard-out">Дууссан</span> : isNew ? <span className="pcard-tag">Шинэ</span> : null}
        {pct > 0 && p.stock > 0 && <span className="pcard-off">-{pct}%</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{p.name}</div>
        <PriceBlock price={p.price} compareAtPrice={p.compareAtPrice} />
        <div className="pcard-delivery">
          <RocketBadge />
          <span className="arrive">{arrivalLabel()}</span>
        </div>
        <Stars count={p.ratingCount} sum={p.ratingSum} />
        {(showShop || p.sold) && (
          <div className="pcard-meta">
            {showShop && <span className="pcard-shop">{p.shop.name}</span>}
            {p.sold ? <span className="pcard-sold">{p.sold} зарагдсан</span> : null}
          </div>
        )}
      </div>
    </Link>
  );
}
