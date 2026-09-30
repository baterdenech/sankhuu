"use client";

import Link from "next/link";
import { useCart } from "./cart-store";

export function CartButton({ slug }: { slug: string }) {
  const { count } = useCart(slug);
  return (
    <Link href={`/s/${slug}/cart`} className="sf-cart-btn" aria-label={`Сагс, ${count} бараа`}>
      Сагс{count > 0 && <span className="sf-cart-count">{count}</span>}
    </Link>
  );
}
