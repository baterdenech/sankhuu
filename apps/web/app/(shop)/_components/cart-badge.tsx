"use client";

import { useCart } from "./cart-store";

export function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return <span className="bnav-badge">{count > 99 ? "99+" : count}</span>;
}
