"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMNT } from "@/lib/labels";
import Link from "next/link";
import { useCart, type CartItem } from "../../../../_components/cart-store";
import { CheckIcon, StoreIcon } from "../../../../_components/icons";

export type VariantOption = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

// Coupang маяг: тоо ширхэг нь хуудасны дотор ("수량" мөр), доод мөрөнд зөвхөн 2 том товч:
// "Сагсанд нэмэх" (цагаан, цэнхэр хүрээ) · "Шууд захиалах" (цэнхэр). Доод мөр fixed тул DOM-ын байрлал хамаагүй.
// Хувилбартай бараа: эхлээд хувилбараа (размер, өнгө) сонгоно; үнэ, үлдэгдэл, сагсны мөр хувилбараар.
export function BuyBar({
  item: base,
  variants = [],
}: {
  item: Omit<CartItem, "qty">;
  variants?: VariantOption[];
}) {
  const cart = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(() =>
    variants.length === 1 && variants[0].stock > 0 ? variants[0].id : null,
  );
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const needsVariant = variants.length > 0 && !variant;
  const item: Omit<CartItem, "qty"> = variant
    ? {
        ...base,
        variantId: variant.id,
        variantName: variant.name,
        price: variant.price ?? base.price,
        maxQty: variant.stock,
      }
    : base;
  const inCart = cart.qtyOf(item.productId, item.variantId);
  const left = needsVariant ? 0 : item.maxQty - inCart;

  const picker = variants.length > 0 && (
    <div className="variant-pick" role="radiogroup" aria-label="Хувилбар">
      <span className="variant-pick-label">
        Хувилбар{variant ? <b>{variant.name}</b> : <em>сонгоно уу</em>}
      </span>
      <div className="variant-btns">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={v.id === variantId}
            className={`variant-btn${v.id === variantId ? " on" : ""}${v.stock === 0 ? " out" : ""}`}
            disabled={v.stock === 0}
            onClick={() => (setVariantId(v.id), setQty(1))}
            title={
              v.stock === 0
                ? "Дууссан"
                : v.price && v.price !== base.price
                  ? formatMNT(v.price)
                  : undefined
            }
          >
            {v.name}
            {v.price !== null && v.price !== base.price && (
              <small>{formatMNT(v.price)}</small>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (base.maxQty === 0) {
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
      {picker}
      <div className="qty-row">
        <span>Тоо ширхэг</span>
        <div className="qty">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Хасах"
            disabled={qty <= 1}
          >
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(Math.max(left, 1), q + 1))}
            aria-label="Нэмэх"
            disabled={qty >= left}
          >
            +
          </button>
        </div>
        <strong className="qty-total">{formatMNT(item.price * qty)}</strong>
      </div>
      {needsVariant && <p className="qty-note">Хувилбараа сонгоно уу</p>}
      {inCart > 0 && (
        <p className="qty-note">
          Сагсанд {inCart} ш байна{left <= 0 ? " · үлдэгдэл бүгд сагсанд" : ""}
        </p>
      )}
      <div className="buybar">
        <Link
          href={`/s/${item.shopSlug}`}
          className="buybar-icon"
          aria-label="Дэлгүүр"
        >
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
