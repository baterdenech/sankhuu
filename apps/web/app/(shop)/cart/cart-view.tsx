"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { formatMNT } from "@/lib/labels";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";
import { useCart } from "../_components/cart-store";
import { placeOrder, type CheckoutState } from "./actions";

export function CartView() {
  const cart = useCart();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const v = state.values ?? {};
  const [district, setDistrict] = useState("");
  useEffect(() => {
    if (v.district) setDistrict(v.district);
  }, [v.district]);
  const fee = district ? deliveryFeeFor(district) : null;

  const groups = useMemo(() => {
    const m = new Map<string, { shopName: string; shopSlug: string; items: typeof cart.items }>();
    for (const i of cart.items) {
      const g = m.get(i.shopId) ?? { shopName: i.shopName, shopSlug: i.shopSlug, items: [] };
      g.items.push(i);
      m.set(i.shopId, g);
    }
    return [...m.values()];
  }, [cart.items]);
  const shopCount = groups.length;
  const deliveryTotal = fee === null ? 0 : fee * shopCount;

  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Сагс{cart.count > 0 ? ` (${cart.count})` : ""}</h1>
      </header>

      {cart.items.length === 0 ? (
        <div className="empty tall">
          <p>Сагс хоосон байна.</p>
          <Link href="/" className="btn primary">
            Бараа үзэх
          </Link>
        </div>
      ) : (
        <form action={formAction} className="checkout">
          <input type="hidden" name="cart" value={JSON.stringify(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))} />

          {groups.map((g) => (
            <section key={g.shopSlug} className="cart-group">
              <Link href={`/s/${g.shopSlug}`} className="cart-group-head">
                {g.shopName} ›
              </Link>
              {g.items.map((i) => (
                <div key={i.productId} className="cart-line">
                  <div className="cart-line-media">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt="" />
                    ) : null}
                  </div>
                  <div className="cart-line-body">
                    <div className="cart-line-name">{i.name}</div>
                    <div className="cart-line-row">
                      <strong>{formatMNT(i.price)}</strong>
                      <div className="qty">
                        <button type="button" onClick={() => cart.setQty(i.productId, i.qty - 1)} aria-label="Хасах">
                          −
                        </button>
                        <span>{i.qty}</span>
                        <button type="button" onClick={() => cart.setQty(i.productId, i.qty + 1)} disabled={i.qty >= i.maxQty} aria-label="Нэмэх">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="cart-remove" onClick={() => cart.remove(i.productId)} aria-label="Устгах">
                    ×
                  </button>
                </div>
              ))}
            </section>
          ))}

          <section className="cart-group form">
            <h2 className="cart-group-head static">Хүргэлтийн мэдээлэл</h2>
            <label htmlFor="name">Нэр</label>
            <input id="name" name="name" defaultValue={v.name ?? ""} required maxLength={60} autoComplete="name" />
            <label htmlFor="phone">Утас</label>
            <div className="phone-input">
              <span>+976</span>
              <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? ""} required maxLength={9} autoComplete="tel-national" placeholder="9911 2233" />
            </div>
            <div className="row">
              <div>
                <label htmlFor="district">Дүүрэг</label>
                <select id="district" name="district" required value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="" disabled>
                    Сонгох
                  </option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="khoroo">Хороо</label>
                <input id="khoroo" name="khoroo" inputMode="numeric" defaultValue={v.khoroo ?? ""} maxLength={20} />
              </div>
            </div>
            <label htmlFor="details">Дэлгэрэнгүй хаяг</label>
            <textarea id="details" name="details" rows={2} required defaultValue={v.details ?? ""} maxLength={300} placeholder="Байр, орц, давхар, тоот, орох тэмдэг" />
            <label htmlFor="note">
              Нэмэлт тайлбар <span className="muted">(заавал биш)</span>
            </label>
            <input id="note" name="note" defaultValue={v.note ?? ""} maxLength={300} placeholder="Размер, өнгө, хүргэх цаг г.м." />
          </section>

          <section className="cart-group summary">
            <div>
              <span>Бараа ({cart.count})</span>
              <span>{formatMNT(cart.subtotal)}</span>
            </div>
            <div>
              <span>Хүргэлт{shopCount > 1 ? ` (${shopCount} дэлгүүр)` : ""}</span>
              <span>{district ? (fee === null ? "Энэ бүсэд хүргэхгүй" : formatMNT(deliveryTotal)) : "Дүүргээ сонгоно уу"}</span>
            </div>
            <div className="total">
              <span>Нийт</span>
              <span>{formatMNT(cart.subtotal + deliveryTotal)}</span>
            </div>
            <p className="muted small-text">Төлбөрийг бараагаа хүлээн авахдаа жолоочид бэлнээр эсвэл шилжүүлгээр төлнө.{shopCount > 1 ? " Дэлгүүр бүрийн бараа тусдаа хүргэгдэнэ." : ""}</p>
            {state.error && <p className="form-error">{state.error}</p>}
          </section>

          <div className="buybar">
            <div className="buybar-total">
              <span className="muted small-text">Нийт</span>
              <strong>{formatMNT(cart.subtotal + deliveryTotal)}</strong>
            </div>
            <button type="submit" className="btn big primary" disabled={pending || fee === null}>
              {pending ? "Илгээж байна…" : "Захиалах"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
