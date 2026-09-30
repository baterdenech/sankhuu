"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@sankhuu/db";
import { setOrderStatus } from "./actions";

// Худалдагчийн үйлдлүүд. Жолооч оноогдсон бол хүргэлтийн шилжилтийг жолооч хийнэ (товч харагдахгүй).
export function OrderActions({ id, status, driverName }: { id: string; status: OrderStatus; driverName?: string | null }) {
  const [pending, start] = useTransition();
  const go = (next: OrderStatus, confirmText?: string) => () => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(() => setOrderStatus(id, next));
  };
  const hasDriver = Boolean(driverName);

  if (status === "NEW")
    return (
      <div className="order-actions">
        <button className="btn primary" disabled={pending} onClick={go("CONFIRMED")}>
          Баталгаажуулах
        </button>
        <button className="btn" disabled={pending} onClick={go("CANCELLED", "Захиалгыг цуцлах уу? Үлдэгдэл буцаж нэмэгдэнэ.")}>
          Цуцлах
        </button>
      </div>
    );
  if (status === "CONFIRMED")
    return (
      <div className="order-actions">
        <button className="btn primary" disabled={pending} onClick={go("READY_FOR_PICKUP")}>
          Савлаж бэлэн боллоо
        </button>
        <button className="btn" disabled={pending} onClick={go("CANCELLED", "Захиалгыг цуцлах уу? Үлдэгдэл буцаж нэмэгдэнэ.")}>
          Цуцлах
        </button>
      </div>
    );
  if (status === "READY_FOR_PICKUP")
    return (
      <div className="order-actions">
        {hasDriver ? (
          <span className="muted small-text">Жолооч {driverName} барааг авахаар ирнэ. Статусыг жолооч шинэчилнэ.</span>
        ) : (
          <button className="btn primary" disabled={pending} onClick={go("IN_DELIVERY")}>
            Өөрөө хүргэлтэд гаргах
          </button>
        )}
        <button className="btn" disabled={pending} onClick={go("CANCELLED", "Захиалгыг цуцлах уу?")}>
          Цуцлах
        </button>
      </div>
    );
  if (status === "IN_DELIVERY")
    return (
      <div className="order-actions">
        {hasDriver ? (
          <span className="muted small-text">Жолооч {driverName} хүргэж байна.</span>
        ) : (
          <button className="btn primary" disabled={pending} onClick={go("DELIVERED", "Бараа хүргэгдэж, төлбөр төлөгдсөн үү?")}>
            Хүргэгдсэн
          </button>
        )}
      </div>
    );
  return null;
}
