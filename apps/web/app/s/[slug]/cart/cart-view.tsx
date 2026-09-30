"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { formatMNT } from "@/lib/labels";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";
import { useCart } from "../cart-store";
import { placeOrder, type CheckoutState } from "../actions";

export function CartView({ slug }: { slug: string }) {
  const cart = useCart(slug);
  const action = placeOrder.bind(null, slug);
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(action, {});
  const v = state.values ?? {};
  const [district, setDistrict] = useState(v.district ?? "");
  useEffect(() => {
    if (v.district) setDistrict(v.district);
  }, [v.district]);
  const fee = district ? deliveryFeeFor(district) : null;

  if (cart.items.length === 0) {
    return (
      <div className="empty">
        <p>Сагс хоосон байна.</p>
        <Link href={`/s/${slug}`} className="btn primary">
          Бараа үзэх
        </Link>
      </div>
    );
  }

  return (
    <div className="sf-cart">
      <h1>Сагс</h1>
      <ul className="sf-lines">
        {cart.items.map((i) => (
          <li key={i.productId} className="sf-line">
            <div className="sf-line-media">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" />
              ) : null}
            </div>
            <div className="sf-line-body">
              <div className="sf-line-name">{i.name}</div>
              <div className="sf-line-price">{formatMNT(i.price)}</div>
              <div className="stock">
                <button type="button" onClick={() => cart.setQty(i.productId, i.qty - 1)} aria-label="Хасах">
                  −
                </button>
                <span>{i.qty} ш</span>
                <button type="button" onClick={() => cart.setQty(i.productId, i.qty + 1)} disabled={i.qty >= i.maxQty} aria-label="Нэмэх">
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <form action={formAction} className="form sf-checkout">
        <input type="hidden" name="cart" value={JSON.stringify(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))} />
        <h2>Хүргэлтийн мэдээлэл</h2>
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

        <dl className="sf-summary">
          <div>
            <dt>Бараа</dt>
            <dd>{formatMNT(cart.subtotal)}</dd>
          </div>
          <div>
            <dt>Хүргэлт</dt>
            <dd>{district ? (fee === null ? "Энэ бүсэд хүргэхгүй" : formatMNT(fee)) : "Дүүргээ сонгоно уу"}</dd>
          </div>
          <div className="total">
            <dt>Нийт</dt>
            <dd>{formatMNT(cart.subtotal + (fee ?? 0))}</dd>
          </div>
        </dl>
        <p className="muted small-text">Төлбөрийг бараагаа хүлээн авахдаа жолоочид бэлнээр эсвэл шилжүүлгээр төлнө.</p>

        {state.error && <p className="form-error">{state.error}</p>}
        <button type="submit" disabled={pending || fee === null}>
          {pending ? "Илгээж байна…" : "Захиалах"}
        </button>
      </form>
    </div>
  );
}
