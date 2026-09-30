"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@sankhuu/db";
import { setOrderStatus } from "./actions";

export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const go = (next: OrderStatus, confirmText?: string) => () => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(() => setOrderStatus(id, next));
  };

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
        <button className="btn primary" disabled={pending} onClick={go("IN_DELIVERY")}>
          Хүргэлтэд гаргах
        </button>
        <button className="btn" disabled={pending} onClick={go("CANCELLED", "Захиалгыг цуцлах уу?")}>
          Цуцлах
        </button>
      </div>
    );
  if (status === "IN_DELIVERY")
    return (
      <div className="order-actions">
        <button className="btn primary" disabled={pending} onClick={go("DELIVERED", "Бараа хүргэгдэж, төлбөр төлөгдсөн үү?")}>
          Хүргэгдсэн
        </button>
      </div>
    );
  return null;
}
