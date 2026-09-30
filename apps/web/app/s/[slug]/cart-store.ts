"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { productId: string; name: string; price: number; image: string | null; qty: number; maxQty: number };

const listeners = new Set<() => void>();
const key = (slug: string) => `sankhuu-cart:${slug}`;
const cache = new Map<string, CartItem[]>();

function read(slug: string): CartItem[] {
  if (cache.has(slug)) return cache.get(slug)!;
  let items: CartItem[] = [];
  try {
    items = JSON.parse(localStorage.getItem(key(slug)) ?? "[]");
  } catch {}
  cache.set(slug, items);
  return items;
}

function write(slug: string, items: CartItem[]) {
  cache.set(slug, items);
  try {
    localStorage.setItem(key(slug), JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

const EMPTY: CartItem[] = [];

export function useCart(slug: string) {
  const items = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => read(slug),
    () => EMPTY,
  );
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
    add(item: Omit<CartItem, "qty">, qty = 1) {
      const cur = read(slug);
      const found = cur.find((i) => i.productId === item.productId);
      const next = found
        ? cur.map((i) => (i.productId === item.productId ? { ...i, qty: Math.min(i.maxQty, i.qty + qty) } : i))
        : [...cur, { ...item, qty: Math.min(item.maxQty, qty) }];
      write(slug, next);
    },
    setQty(productId: string, qty: number) {
      const next = read(slug)
        .map((i) => (i.productId === productId ? { ...i, qty: Math.min(i.maxQty, qty) } : i))
        .filter((i) => i.qty > 0);
      write(slug, next);
    },
    clear() {
      write(slug, []);
    },
  };
}
