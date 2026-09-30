"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartItem } from "../../../../_components/cart-store";
import { CartIcon, CheckIcon, StoreIcon } from "../../../../_components/icons";

// Дэлгэцийн доод талд наалдсан худалдан авах мөр (Дэлгүүр · Сагс · Сагсанд нэмэх · Худалдаж авах)
export function BuyBar({ item, shopHref }: { item: Omit<CartItem, "qty">; shopHref: string }) {
  const cart = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const inCart = cart.qtyOf(item.productId);
  const left = item.maxQty - inCart;
  const soldOut = item.maxQty === 0;

  return (
    <div className="buybar pdp-bar">
      <Link href={shopHref} className="buybar-icon">
        <StoreIcon size={22} />
        <span>Дэлгүүр</span>
      </Link>
      <Link href="/cart" className="buybar-icon">
        <span className="buybar-icon-wrap">
          <CartIcon size={22} />
          {cart.count > 0 && <span className="bnav-badge">{cart.count}</span>}
        </span>
        <span>Сагс</span>
      </Link>
      {soldOut ? (
        <button type="button" className="btn big" disabled>
          Дууссан
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn big warm"
            disabled={left <= 0}
            onClick={() => {
              cart.add(item, 1);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
          >
            {added ? (
              <>
                <CheckIcon size={18} /> Нэмэгдлээ
              </>
            ) : inCart ? (
              `Сагсанд (${inCart})`
            ) : (
              "Сагсанд нэмэх"
            )}
          </button>
          <button
            type="button"
            className="btn big hot"
            onClick={() => {
              if (inCart === 0) cart.add(item, 1);
              router.push("/cart");
            }}
          >
            Худалдаж авах
          </button>
        </>
      )}
    </div>
  );
}
