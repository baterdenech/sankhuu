"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { formatMNT } from "@/lib/labels";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";
import { useCart } from "../_components/cart-store";
import { ProductImage, RocketBadge } from "../_components/product-card";
import { CartIcon, ChevronIcon } from "../_components/icons";
import { arrivalLabel } from "../_components/catalog-meta";
import { placeOrder, type CheckoutState } from "./actions";
import { LocationPicker } from "@/app/_components/location-picker";

// Coupang маягийн сагс: "Бүгдийг сонгох" + мөр бүрт checkbox, дэлгүүр бүрээр бүлэглэж хүргэлтийн хөлс, доор наалддаг "Захиалах (n)"
export type CheckoutPrefill = { name: string; phone: string; district: string; khoroo: string; details: string };

export function CartView({ prefill }: { prefill?: CheckoutPrefill | null }) {
  const cart = useCart();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const v: Record<string, string> = state.values ?? prefill ?? {};
  const [district, setDistrict] = useState(prefill?.district ?? "");
  // Сонгоогүй барааны id (анхдагчаар бүгд сонгогдсон тул "хасагдсан" жагсаалт хадгална)
  const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set());
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

  const isOn = (id: string) => !unchecked.has(id);
  const selected = cart.items.filter((i) => isOn(i.productId));
  const selCount = selected.reduce((n, i) => n + i.qty, 0);
  const selSubtotal = selected.reduce((n, i) => n + i.qty * i.price, 0);
  const selShops = new Set(selected.map((i) => i.shopId)).size;
  const deliveryTotal = fee === null ? 0 : fee * selShops;
  const allOn = cart.items.length > 0 && selected.length === cart.items.length;

  function toggle(id: string) {
    setUnchecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setUnchecked(allOn ? new Set(cart.items.map((i) => i.productId)) : new Set());
  }

  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Сагс{cart.count > 0 ? ` (${cart.count})` : ""}</h1>
      </header>

      {cart.items.length === 0 ? (
        <div className="empty tall">
          <span className="empty-icon">
            <CartIcon size={30} />
          </span>
          <p>Сагс хоосон байна.</p>
          <Link href="/" className="btn primary">
            Бараа үзэх
          </Link>
        </div>
      ) : (
        <form action={formAction} className="checkout">
          <input type="hidden" name="cart" value={JSON.stringify(selected.map((i) => ({ productId: i.productId, qty: i.qty })))} />

          <div className="cart-toolbar">
            <label className="check">
              <input type="checkbox" checked={allOn} onChange={toggleAll} />
              <span>
                Бүгдийг сонгох ({selected.length}/{cart.items.length})
              </span>
            </label>
            <button type="button" className="link-button" onClick={() => selected.forEach((i) => cart.remove(i.productId))} disabled={selected.length === 0}>
              Сонгосныг устгах
            </button>
          </div>

          {groups.map((g) => {
            const gItems = g.items.filter((i) => isOn(i.productId));
            const gSub = gItems.reduce((n, i) => n + i.qty * i.price, 0);
            return (
              <section key={g.shopSlug} className="cart-group">
                <Link href={`/s/${g.shopSlug}`} className="cart-group-head">
                  {g.shopName} <ChevronIcon size={14} />
                </Link>
                {g.items.map((i) => (
                  <div key={i.productId} className={`cart-line${isOn(i.productId) ? "" : " off"}`}>
                    <label className="check cart-check" aria-label="Сонгох">
                      <input type="checkbox" checked={isOn(i.productId)} onChange={() => toggle(i.productId)} />
                    </label>
                    <Link href={`/s/${i.shopSlug}/p/${i.productId}`} className="cart-line-media">
                      <ProductImage src={i.image ?? undefined} alt="" category={i.category} />
                    </Link>
                    <div className="cart-line-body">
                      <div className="cart-line-name">{i.name}</div>
                      <div className="cart-line-row">
                        <strong>{formatMNT(i.price * i.qty)}</strong>
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
                <div className="cart-group-foot">
                  <span className="cart-group-ship">
                    <RocketBadge /> <span className="arrive">{arrivalLabel()}</span>
                  </span>
                  <span className="muted small-text">
                    {gItems.length > 0 ? (
                      <>
                        Бараа {formatMNT(gSub)} · Хүргэлт {district ? (fee === null ? "—" : formatMNT(fee)) : "дүүргээр"}
                      </>
                    ) : (
                      "Сонгосон бараа алга"
                    )}
                  </span>
                </div>
              </section>
            );
          })}

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
            <LocationPicker compact />
            <label htmlFor="note">
              Нэмэлт тайлбар <span className="muted">(заавал биш)</span>
            </label>
            <input id="note" name="note" defaultValue={v.note ?? ""} maxLength={300} placeholder="Размер, өнгө, хүргэх цаг г.м." />
          </section>

          <section className="cart-group summary">
            <div>
              <span>Бараа ({selCount})</span>
              <span>{formatMNT(selSubtotal)}</span>
            </div>
            <div>
              <span>Хүргэлт{selShops > 1 ? ` (${selShops} дэлгүүр)` : ""}</span>
              <span>{district ? (fee === null ? "Энэ бүсэд хүргэхгүй" : formatMNT(deliveryTotal)) : "Дүүргээ сонгоно уу"}</span>
            </div>
            <div className="total">
              <span>Нийт төлөх</span>
              <span>{formatMNT(selSubtotal + deliveryTotal)}</span>
            </div>
            <p className="muted small-text">Төлбөрийг бараагаа хүлээн авахдаа жолоочид бэлнээр эсвэл шилжүүлгээр төлнө.{selShops > 1 ? " Дэлгүүр бүрийн бараа тусдаа хүргэгдэнэ." : ""}</p>
            {state.error && <p className="form-error">{state.error}</p>}
          </section>

          <div className="buybar">
            <div className="buybar-total">
              <span className="muted small-text">Нийт төлөх</span>
              <strong>{formatMNT(selSubtotal + deliveryTotal)}</strong>
            </div>
            <button type="submit" className="btn big primary" disabled={pending || fee === null || selected.length === 0}>
              {pending ? "Илгээж байна…" : `Захиалах (${selCount})`}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
