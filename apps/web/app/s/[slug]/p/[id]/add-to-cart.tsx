"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type CartItem } from "../../cart-store";

export function AddToCart({ slug, item }: { slug: string; item: Omit<CartItem, "qty"> }) {
  const cart = useCart(slug);
  const [added, setAdded] = useState(false);
  const inCart = cart.items.find((i) => i.productId === item.productId)?.qty ?? 0;
  const left = item.maxQty - inCart;

  if (item.maxQty === 0) return <p className="sf-soldout">Энэ бараа дууссан байна.</p>;

  return (
    <div className="sf-add">
      <button
        type="button"
        className="btn primary big"
        disabled={left <= 0}
        onClick={() => {
          cart.add(item, 1);
          setAdded(true);
        }}
      >
        {left <= 0 ? "Үлдэгдэл дууссан" : inCart ? `Дахин нэмэх (сагсанд ${inCart})` : "Сагсанд нэмэх"}
      </button>
      {added && (
        <Link href={`/s/${slug}/cart`} className="btn big">
          Сагс руу очих →
        </Link>
      )}
      {item.maxQty <= 3 && <p className="muted small-text">Зөвхөн {item.maxQty} ширхэг үлдсэн</p>}
    </div>
  );
}
