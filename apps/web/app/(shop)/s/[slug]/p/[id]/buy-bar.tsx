"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMNT } from "@/lib/labels";
import Link from "next/link";
import { useCart, type CartItem } from "../../../../_components/cart-store";
import { CheckIcon, StoreIcon } from "../../../../_components/icons";

// Coupang маяг: тоо ширхэг нь хуудасны дотор ("수량" мөр), доод мөрөнд зөвхөн 2 том товч:
// "Сагсанд нэмэх" (цагаан, цэнхэр хүрээ) · "Шууд захиалах" (цэнхэр). Доод мөр fixed тул DOM-ын байрлал хамаагүй.
export function BuyBar({ item }: { item: Omit<CartItem, "qty"> }) {
  const cart = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = cart.qtyOf(item.productId);
  const left = item.maxQty - inCart;

  if (item.maxQty === 0) {
    return (
      <div className="buybar">
        <button type="button" className="btn big" disabled>
          Дууссан
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="qty-row">
        <span>Тоо ширхэг</span>
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Хасах" disabled={qty <= 1}>
            −
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(Math.max(left, 1), q + 1))} aria-label="Нэмэх" disabled={qty >= left}>
            +
          </button>
        </div>
        <strong className="qty-total">{formatMNT(item.price * qty)}</strong>
      </div>
      {inCart > 0 && (
        <p className="qty-note">
          Сагсанд {inCart} ш байна{left <= 0 ? " · үлдэгдэл бүгд сагсанд" : ""}
        </p>
      )}
      <div className="buybar">
        <Link href={`/s/${item.shopSlug}`} className="buybar-icon" aria-label="Дэлгүүр">
          <StoreIcon size={22} />
          <span>Дэлгүүр</span>
        </Link>
        <button
          type="button"
          className="btn big outline"
          disabled={left <= 0}
          onClick={() => {
            cart.add(item, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1400);
          }}
        >
          {added ? (
            <>
              <CheckIcon size={18} /> Нэмэгдлээ
            </>
          ) : (
            "Сагсанд нэмэх"
          )}
        </button>
        <button
          type="button"
          className="btn big primary"
          disabled={left <= 0 && inCart === 0}
          onClick={() => {
            if (left > 0) cart.add(item, qty);
            router.push("/cart");
          }}
        >
          Шууд захиалах
        </button>
      </div>
    </>
  );
}
