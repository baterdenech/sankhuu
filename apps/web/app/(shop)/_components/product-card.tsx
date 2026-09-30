import Link from "next/link";
import { formatMNT } from "@/lib/labels";

export type CardProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  shop: { slug: string; name: string };
  sold?: number;
};

export function ProductCard({ p, showShop = true }: { p: CardProduct; showShop?: boolean }) {
  return (
    <Link href={`/s/${p.shop.slug}/p/${p.id}`} className={`pcard${p.stock === 0 ? " sold-out" : ""}`}>
      <div className="pcard-media">
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} loading="lazy" />
        ) : (
          <span className="no-image">Зураггүй</span>
        )}
        {p.stock === 0 && <span className="pcard-out">Дууссан</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{p.name}</div>
        <div className="pcard-price">{formatMNT(p.price)}</div>
        <div className="pcard-meta">
          {showShop && <span className="pcard-shop">{p.shop.name}</span>}
          {p.sold ? <span>{p.sold} зарагдсан</span> : null}
        </div>
      </div>
    </Link>
  );
}
