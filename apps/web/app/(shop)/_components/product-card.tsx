import Link from "next/link";
import { categoryStyle } from "./catalog-meta";

export type CardProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  category?: string | null;
  createdAt?: Date;
  shop: { slug: string; name: string };
  sold?: number;
};

export function Price({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`price ${className}`}>
      {value.toLocaleString("en-US")}
      <span className="price-cur">₮</span>
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
        {p.stock === 0 ? <span className="tag tag-out">Дууссан</span> : isNew ? <span className="tag tag-new">Шинэ</span> : null}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{p.name}</div>
        <Price value={p.price} className="pcard-price" />
        <div className="pcard-meta">
          {showShop && <span className="pcard-shop">{p.shop.name}</span>}
          {p.sold ? <span className="pcard-sold">{p.sold} зарагдсан</span> : null}
        </div>
      </div>
    </Link>
  );
}
