"use client";

import { useEffect } from "react";
import { saveOrders, useCart } from "../../_components/cart-store";

// Захиалга амжилттай болмогц захиалсан барааг сагснаас хасаж (сонгоогүй нь үлдэнэ), дугааруудыг "Миний" хуудсанд хадгална
export function AfterOrder({ orders, lineKeys }: { orders: { number: number; phone: string }[]; lineKeys: string[] }) {
  const cart = useCart();
  useEffect(() => {
    if (lineKeys.length === 0) cart.clear();
    else lineKeys.forEach((k) => cart.remove(k));
    saveOrders(orders.map((o) => ({ ...o, at: Date.now() })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
