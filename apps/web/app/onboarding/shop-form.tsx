"use client";

import { useActionState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { createShop, type FormState } from "./actions";

export function ShopForm({ defaultPhone }: { defaultPhone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createShop, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="form">
      <label htmlFor="name">Дэлгүүрийн нэр</label>
      <input id="name" name="name" defaultValue={v.name ?? ""} placeholder="Жишээ: Сарнай Бутик" required autoFocus maxLength={60} />

      <label htmlFor="phone">Холбоо барих утас</label>
      <div className="phone-input">
        <span>+976</span>
        <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone ?? defaultPhone} maxLength={9} required />
      </div>

      <label htmlFor="facebookPageUrl">
        Нийгмийн сүлжээний холбоос <span className="muted">(заавал биш)</span>
      </label>
      <input id="facebookPageUrl" name="facebookPageUrl" type="url" inputMode="url" defaultValue={v.facebookPageUrl ?? ""} placeholder="https://..." />

      <fieldset className="fieldset">
        <legend>Жолооч барааг хаанаас авах вэ?</legend>
        <div className="row">
          <div>
            <label htmlFor="district">Дүүрэг</label>
            <select key={v.district ?? ""} id="district" name="district" required defaultValue={v.district ?? ""}>
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
            <input id="khoroo" name="khoroo" inputMode="numeric" defaultValue={v.khoroo ?? ""} placeholder="жишээ: 14" maxLength={20} />
          </div>
        </div>
        <label htmlFor="details">Дэлгэрэнгүй хаяг</label>
        <textarea id="details" name="details" rows={2} required defaultValue={v.details ?? ""} placeholder="Байр, орц, давхар, тоот, орох тэмдэг" maxLength={300} />
      </fieldset>

      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Хадгалж байна…" : "Дэлгүүр үүсгэх"}
      </button>
    </form>
  );
}
