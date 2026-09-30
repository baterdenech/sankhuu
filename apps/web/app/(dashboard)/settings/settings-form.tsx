"use client";

import { useActionState, useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { compressImage } from "../products/compress-image";
import { updateShop, type SettingsState } from "./actions";
import { LocationPicker } from "@/app/_components/location-picker";

type Initial = { name: string; phone: string; facebookPageUrl: string; district: string; khoroo: string; details: string; logoUrl: string | null; lat: number | null; lng: number | null };

export function SettingsForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    async (prev, fd) => {
      // Логог клиент дээр 512px болгож багасгана
      const f = fd.get("logo");
      if (f instanceof File && f.size > 0) fd.set("logo", await compressImage(f, 512, 0.85));
      return updateShop(prev, fd);
    },
    {},
  );
  const v = { ...initial, ...(state.values ?? {}) };
  const [preview, setPreview] = useState<string | null>(initial.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);

  return (
    <form action={action} className="form">
      <label>Лого</label>
      <div className="logo-row">
        <label className="logo-drop">
          {preview && !removeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" />
          ) : (
            <span className="logo-letter">{v.name.slice(0, 1) || "S"}</span>
          )}
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPreview(URL.createObjectURL(f));
                setRemoveLogo(false);
              }
            }}
          />
        </label>
        <div className="logo-help">
          <span className="muted small-text">Дөрвөлжин зураг тохиромжтой. Дэлгүүрийн хуудас, хуваалцах холбоос дээр харагдана.</span>
          {preview && !removeLogo && (
            <button type="button" className="link-button" onClick={() => setRemoveLogo(true)}>
              Логог устгах
            </button>
          )}
          <input type="hidden" name="removeLogo" value={removeLogo ? "1" : ""} />
        </div>
      </div>

      <label htmlFor="name">Дэлгүүрийн нэр</label>
      <input id="name" name="name" defaultValue={v.name} required maxLength={60} />

      <label htmlFor="phone">Холбоо барих утас</label>
      <div className="phone-input">
        <span>+976</span>
        <input id="phone" name="phone" type="tel" inputMode="numeric" defaultValue={v.phone} maxLength={9} required />
      </div>

      <label htmlFor="facebookPageUrl">
        Нийгмийн сүлжээний холбоос <span className="muted">(заавал биш)</span>
      </label>
      <input id="facebookPageUrl" name="facebookPageUrl" type="url" inputMode="url" defaultValue={v.facebookPageUrl} placeholder="https://..." />

      <fieldset className="fieldset">
        <legend>Жолооч барааг хаанаас авах вэ?</legend>
        <div className="row">
          <div>
            <label htmlFor="district">Дүүрэг</label>
            <select key={v.district} id="district" name="district" required defaultValue={v.district}>
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
            <input id="khoroo" name="khoroo" inputMode="numeric" defaultValue={v.khoroo} maxLength={20} />
          </div>
        </div>
        <label htmlFor="details">Дэлгэрэнгүй хаяг</label>
        <textarea id="details" name="details" rows={2} required defaultValue={v.details} maxLength={300} />
        <LocationPicker initial={initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null} />
      </fieldset>

      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="ai-status ok">{state.ok}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Хадгалж байна…" : "Хадгалах"}
      </button>
    </form>
  );
}
