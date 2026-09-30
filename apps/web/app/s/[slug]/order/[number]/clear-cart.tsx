"use client";

import { useEffect } from "react";
import { useCart } from "../../cart-store";

export function ClearCart({ slug }: { slug: string }) {
  const cart = useCart(slug);
  useEffect(() => {
    cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
