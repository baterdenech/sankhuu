"use client";

import { useEffect } from "react";
import { saveOrders, useCart } from "../../_components/cart-store";

// Захиалга амжилттай болмогц захиалсан барааг сагснаас хасаж (сонгоогүй нь үлдэнэ), дугааруудыг "Миний" хуудсанд хадгална
export function AfterOrder({ orders, productIds }: { orders: { number: number; phone: string }[]; productIds: string[] }) {
  const cart = useCart();
  useEffect(() => {
    if (productIds.length === 0) cart.clear();
    else productIds.forEach((id) => cart.remove(id));
    saveOrders(orders.map((o) => ({ ...o, at: Date.now() })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
