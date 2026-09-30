"use client";

import { useState, useTransition } from "react";
import { formatMNT } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { deliver, fail, pickUp, type DriverActionState } from "./actions";
import { getGeo } from "./geo";

export type DriverDelivery = {
  id: string;
  status: "ASSIGNED" | "PICKED_UP";
  orderNumber: number;
  shopName: string;
  shopPhone: string;
  pickup: { text: string; maps: string };
  customerName: string;
  customerPhone: string;
  dropoff: { text: string; maps: string };
  items: { name: string; quantity: number }[];
  codAmount: number;
  note: string | null;
  assignedAt: string | null;
};

const FAIL_REASONS = ["Утсаа авахгүй байна", "Хаяг олдсонгүй", "Худалдан авагч татгалзсан", "Дараа авна гэсэн"];

// Жолоочийн нэг хүргэлтийн карт: том товчнууд, залгах / газрын зураг холбоос
export function DeliveryCard({ d }: { d: DriverDelivery }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<DriverActionState>({});
  const [mode, setMode] = useState<"idle" | "deliver" | "fail">("idle");
  const [collected, setCollected] = useState(String(d.codAmount));
  const [reason, setReason] = useState(FAIL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const act = (fn: (geo: Awaited<ReturnType<typeof getGeo>>) => Promise<DriverActionState>) =>
    start(async () => {
      const geo = await getGeo();
      const r = await fn(geo);
      setState(r);
      if (!r.error) setMode("idle");
    });
  const pickup = d.status === "ASSIGNED";

  return (
    <li className={`dcard ${pickup ? "pickup" : "dropoff"}`}>
      <div className="dcard-head">
        <span className={`dcard-tag ${pickup ? "tag-pickup" : "tag-drop"}`}>{pickup ? "Дэлгүүрээс авах" : "Хүргэх"}</span>
        <strong>#{d.orderNumber}</strong>
        <span className="muted small-text">{d.assignedAt ? new Date(d.assignedAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
      </div>

      <div className="dcard-place">
        <div className="dcard-who">
          <strong>{pickup ? d.shopName : d.customerName}</strong>
          {!pickup && <span className="muted small-text">{d.shopName}-ийн бараа</span>}
        </div>
        <div className="dcard-addr">{pickup ? d.pickup.text : d.dropoff.text}</div>
        <div className="dcard-links">
          <a href={`tel:${pickup ? d.shopPhone : d.customerPhone}`} className="btn small">
            Залгах · {formatPhone(pickup ? d.shopPhone : d.customerPhone)}
          </a>
          <a href={pickup ? d.pickup.maps : d.dropoff.maps} target="_blank" rel="noreferrer" className="btn small">
            Газрын зураг
          </a>
        </div>
      </div>

      <ul className="dcard-items">
        {d.items.map((i, idx) => (
          <li key={idx}>
            {i.name} <span className="muted">×{i.quantity}</span>
          </li>
        ))}
      </ul>
      {d.note && <div className="dcard-note">Тайлбар: {d.note}</div>}
      <div className="dcard-cod">
        {d.codAmount > 0 ? (
          <>
            Цуглуулах: <strong>{formatMNT(d.codAmount)}</strong>
          </>
        ) : (
          <span className="muted">Төлбөр урьдчилсан, мөнгө авахгүй</span>
        )}
      </div>

      {state.error && <p className="form-error">{state.error}</p>}

      {mode === "idle" && (
        <div className="dcard-actions">
          {pickup ? (
            <button type="button" className="btn big primary" disabled={pending} onClick={() => act((geo) => pickUp(d.id, geo))}>
              {pending ? "…" : "Барааг авлаа"}
            </button>
          ) : (
            <button type="button" className="btn big primary" disabled={pending} onClick={() => setMode("deliver")}>
              Хүргэлээ
            </button>
          )}
          <button type="button" className="btn big" disabled={pending} onClick={() => setMode("fail")}>
            Амжилтгүй
          </button>
        </div>
      )}

      {mode === "deliver" && (
        <div className="dcard-form">
          <label>Хүлээн авсан дүн (₮)</label>
          <input type="number" inputMode="numeric" min={0} value={collected} onChange={(e) => setCollected(e.target.value)} />
          {Number(collected) !== d.codAmount && <p className="small-text form-error">Захиалгын дүн {formatMNT(d.codAmount)}. Зөрүүтэй бол шалтгааныг диспетчерт хэлээрэй.</p>}
          <div className="dcard-actions">
            <button type="button" className="btn big primary" disabled={pending} onClick={() => act((geo) => deliver(d.id, Number(collected), geo))}>
              {pending ? "…" : "Баталгаажуулах"}
            </button>
            <button type="button" className="btn big" disabled={pending} onClick={() => setMode("idle")}>
              Буцах
            </button>
          </div>
        </div>
      )}

      {mode === "fail" && (
        <div className="dcard-form">
          <label>Шалтгаан</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {FAIL_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
            <option value="__other">Бусад…</option>
          </select>
          {reason === "__other" && <input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Шалтгаан" maxLength={200} />}
          <div className="dcard-actions">
            <button type="button" className="btn big danger" disabled={pending} onClick={() => act((geo) => fail(d.id, reason === "__other" ? customReason : reason, geo))}>
              {pending ? "…" : "Амжилтгүй болгох"}
            </button>
            <button type="button" className="btn big" disabled={pending} onClick={() => setMode("idle")}>
              Буцах
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
