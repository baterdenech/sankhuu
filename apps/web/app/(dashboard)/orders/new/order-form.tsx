"use client";

import { useActionState, useMemo, useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { deliveryFeeFor } from "@/lib/delivery-fee";
import { formatMNT } from "@/lib/labels";
import { createManualOrder, type ManualOrderState } from "../actions";

type Product = { id: string; name: string; price: number; stock: number };
type Line = { productId: string; qty: number };

// Гар захиалгын форм: бараа + тоо ширхэг мөрүүд, худалдан авагч, хаяг; дүн, хүргэлтийн хөлс шууд тооцогдоно
export function ManualOrderForm({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState<ManualOrderState, FormData>(createManualOrder, {});
  const v = state.values ?? {};
  const [lines, setLines] = useState<Line[]>(() => {
    try {
      const parsed = v.items ? (JSON.parse(v.items) as Line[]) : [];
      return parsed.length ? parsed : [{ productId: "", qty: 1 }];
    } catch {
      return [{ productId: "", qty: 1 }];
    }
  });
  const [district, setDistrict] = useState(v.district ?? "");
  const fee = district ? deliveryFeeFor(district) : null;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const subtotal = lines.reduce((s, l) => s + (byId.get(l.productId)?.price ?? 0) * l.qty, 0);
  const update = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form action={action} className="form">
      <input type="hidden" name="items" value={JSON.stringify(lines.filter((l) => l.productId && l.qty > 0))} />

      <fieldset className="fieldset">
        <legend>Бараа</legend>
        {lines.map((l, i) => {
          const p = byId.get(l.productId);
          return (
            <div key={i} className="line-row">
              <select value={l.productId} onChange={(e) => update(i, { productId: e.target.value, qty: 1 })} aria-label="Бараа">
                <option value="">Бараа сонгох</option>
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id} disabled={pr.stock === 0}>
                    {pr.name} · {formatMNT(pr.price)}
                    {pr.stock === 0 ? " · дууссан" : ` · ${pr.stock} ш`}
                  </option>
                ))}
              </select>
              <input type="number" min={1} max={p?.stock ?? 999} value={l.qty} onChange={(e) => update(i, { qty: Math.max(1, Number(e.target.value) || 1) })} aria-label="Тоо ширхэг" />
              <span className="line-sum">{p ? formatMNT(p.price * l.qty) : "—"}</span>
              <button type="button" className="link-button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))} aria-label="Хасах">
                ×
              </button>
            </div>
          );
        })}
        <button type="button" className="btn" onClick={() => setLines((ls) => [...ls, { productId: "", qty: 1 }])} style={{ alignSelf: "flex-start" }}>
          + Бараа нэмэх
        </button>
      </fieldset>

      <div className="row">
        <div>
          <label htmlFor="name">Худалдан авагчийн нэр</label>
          <input id="name" name="name" defaultValue={v.name ?? ""} required maxLength={60} />
        </div>
        <div>
          <label htmlFor="phone">Утас</label>
          <div className="phone-input">
            <span>+976</span>
            <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? ""} required maxLength={9} />
          </div>
        </div>
      </div>

      <fieldset className="fieldset">
        <legend>Хүргэх хаяг</legend>
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
      </fieldset>

      <div className="row">
        <div>
          <label htmlFor="source">Захиалга хаанаас ирсэн</label>
          <select id="source" name="source" defaultValue={v.source ?? "PHONE"}>
            <option value="PHONE">Утсаар</option>
            <option value="OTHER">Чат / бусад</option>
          </select>
        </div>
        <div>
          <label htmlFor="payment">Төлбөр</label>
          <select id="payment" name="payment" defaultValue={v.payment ?? "CASH_ON_DELIVERY"}>
            <option value="CASH_ON_DELIVERY">Хүргэлтийн үед (жолоочид)</option>
            <option value="PREPAID_TRANSFER">Урьдчилж шилжүүлсэн</option>
          </select>
        </div>
      </div>
      <label htmlFor="note">
        Тайлбар <span className="muted">(заавал биш)</span>
      </label>
      <input id="note" name="note" defaultValue={v.note ?? ""} maxLength={300} placeholder="Размер, өнгө, хүргэх цаг г.м." />

      <div className="order-summary">
        <div>
          <span>Бараа</span>
          <span>{formatMNT(subtotal)}</span>
        </div>
        <div>
          <span>Хүргэлт</span>
          <span>{district ? (fee === null ? "Энэ бүсэд хүргэхгүй" : formatMNT(fee)) : "Дүүргээ сонгоно уу"}</span>
        </div>
        <div className="total">
          <span>Нийт</span>
          <span>{formatMNT(subtotal + (fee ?? 0))}</span>
        </div>
      </div>
      <p className="muted small-text" style={{ margin: 0 }}>Захиалга "Баталгаажсан" статустай үүсч, худалдан авагчид SMS очно; хүргэлтийг Sankhuu-гийн диспетчер жолоочид онооно.</p>

      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending || fee === null || subtotal === 0}>
        {pending ? "Бүртгэж байна…" : "Захиалга бүртгэх"}
      </button>
    </form>
  );
}
