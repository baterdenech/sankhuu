"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartItem } from "../../../../_components/cart-store";
import { CartIcon, CheckIcon } from "../../../../_components/icons";

// Дэлгэцийн доод талд наалдсан худалдан авах мөр
export function BuyBar({ item }: { item: Omit<CartItem, "qty"> }) {
  const cart = useCart();
  const router = useRouter();
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
    <div className="buybar">
      <button
        type="button"
        className="btn big outline"
        disabled={left <= 0}
        onClick={() => {
          cart.add(item, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? <CheckIcon size={20} /> : <CartIcon size={20} />}
        {added ? "Нэмэгдлээ" : inCart ? `Сагсанд (${inCart})` : "Сагсанд нэмэх"}
      </button>
      <button
        type="button"
        className="btn big primary"
        onClick={() => {
          if (inCart === 0) cart.add(item, 1);
          router.push("/cart");
        }}
      >
        Шууд захиалах
      </button>
    </div>
  );
}
