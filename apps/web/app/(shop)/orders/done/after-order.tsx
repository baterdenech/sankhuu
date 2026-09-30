"use client";

import { useEffect } from "react";
import { saveOrders, useCart } from "../../_components/cart-store";

// Захиалга амжилттай болмогц сагсыг хоослож, дугааруудыг "Миний" хуудсанд хадгална
export function AfterOrder({ orders }: { orders: { number: number; phone: string }[] }) {
  const cart = useCart();
  useEffect(() => {
    cart.clear();
    saveOrders(orders.map((o) => ({ ...o, at: Date.now() })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
